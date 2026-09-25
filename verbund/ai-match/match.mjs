// Verbund AI matching: reads students.csv, asks a local Ollama model to pick
// each new student's buddy, and writes matches.csv for the Framer CMS.
//
// Usage:  node match.mjs [students.csv] [matches.csv] [students-explained.csv]
// Writes: matches.csv            -> import into the Framer "Matches" collection
//         students-explained.csv -> import into the Framer "Students" collection (adds Status + Explanation)
// Needs:  Node 18+, and Ollama running with a model pulled (default: qwen2.5:7b).
//         Change the model with:  MODEL=llama3.2 node match.mjs

import { readFileSync, writeFileSync } from "node:fs"

const [input = "students.csv", output = "matches.csv", studentsOut = "students-explained.csv"] = process.argv.slice(2)
const MODEL = process.env.MODEL || "qwen2.5:7b"
const OLLAMA = process.env.OLLAMA_URL || "http://localhost:11434"
const SHORTLIST = 4 // how many candidate buddies the AI chooses between
const FLAG_BELOW = 75

// ---------- CSV ----------
function parseCsv(text) {
    const rows = []
    let row = [], cell = "", quoted = false
    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
            else if (c === '"') quoted = false
            else cell += c
        } else if (c === '"') quoted = true
        else if (c === ",") { row.push(cell); cell = "" }
        else if (c === "\n" || c === "\r") {
            if (c === "\r" && text[i + 1] === "\n") i++
            row.push(cell); rows.push(row); row = []; cell = ""
        } else cell += c
    }
    if (cell || row.length) { row.push(cell); rows.push(row) }
    const [header, ...body] = rows.filter((r) => r.some((x) => x.trim()))
    const keys = header.map((h) => h.trim().toLowerCase())
    return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || "").trim()])))
}
const toCsv = (rows) =>
    rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n"

// ---------- Students ----------
const pick = (row, ...names) => names.map((n) => row[n]).find(Boolean) || ""
const list = (s) => s.split(/[,;]/).map((x) => x.trim()).filter(Boolean)
const shared = (a, b) => a.filter((x) => b.some((y) => y.toLowerCase() === x.toLowerCase()))
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const students = parseCsv(readFileSync(input, "utf8")).map((r) => ({
    name: pick(r, "name", "title", "full name"),
    grade: pick(r, "grade"),
    role: /buddy/i.test(pick(r, "role")) ? "buddy" : "new",
    langs: list(pick(r, "languages", "language")),
    clubs: list(pick(r, "clubs", "clubs & activities", "activities")),
    bio: pick(r, "bio", "about"),
    interests: pick(r, "interests", "hobbies"),
    background: pick(r, "background", "family", "family / background"),
    newness: pick(r, "newness", "prior experience", "prior experience being new"),
})).filter((s) => s.name)

const newStudents = students.filter((s) => s.role === "new")
const buddies = students.filter((s) => s.role === "buddy")
if (!newStudents.length || !buddies.length) {
    console.error(`Need at least one New student and one Buddy in ${input} (check the Role column).`)
    process.exit(1)
}

// Quick rule-based score, used to shortlist candidates and as a fallback.
const load = new Map(buddies.map((b) => [b.name, []]))
const ruleScore = (a, b) =>
    Math.min(95, 30 + 12 * shared(a.langs, b.langs).length + 10 * shared(a.clubs, b.clubs).length)
const ruleWhy = (a, b) => {
    const l = shared(a.langs, b.langs), c = shared(a.clubs, b.clubs)
    return `Both speak ${l.join(", ") || "no common language"}` + (c.length ? `, and share ${c.join(", ")}.` : ", with no shared activities.")
}

const describe = (s) =>
    `${s.name} (Grade ${s.grade}) - languages: ${s.langs.join(", ") || "none"}; clubs: ${s.clubs.join(", ") || "none"}` +
    (s.interests ? `; interests: ${s.interests}` : "") +
    (s.background ? `; background: ${s.background}` : "") +
    (s.newness ? `; experience of being new: ${s.newness}` : "") +
    (s.bio ? `; about: ${s.bio}` : "")

// ---------- Ollama ----------
async function askAI(prompt) {
    const res = await fetch(`${OLLAMA}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, stream: false, format: "json", options: { temperature: 0.2 }, messages: [{ role: "user", content: prompt }] }),
    })
    if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${await res.text()}`)
    return JSON.parse((await res.json()).message.content)
}

// Returns the AI's JSON, or null (with a warning) if the reply was unusable.
async function tryAI(prompt, who) {
    try {
        return await askAI(prompt)
    } catch (e) {
        if (e.cause?.code === "ECONNREFUSED" || /fetch failed/.test(e.message)) {
            console.error(`Can't reach Ollama at ${OLLAMA}. Is the Ollama app running?`)
            process.exit(1)
        }
        console.warn(`  AI reply for ${who} was unusable (${e.message}); using the rule-based text.`)
        return null
    }
}

const matchPrompt = (student, candidates) => `You match new students at a school with a student "buddy" who helps them settle in.
Shared languages matter most, then shared clubs/activities, then background (e.g. a buddy who was once new themselves).
Spread the load: prefer buddies with fewer students already assigned when candidates are close.

New student:
${describe(student)}

Candidate buddies:
${candidates.map((b) => `- ${describe(b)}
  FACTS: shared languages: ${shared(student.langs, b.langs).join(", ") || "none"}; shared clubs: ${shared(student.clubs, b.clubs).join(", ") || "none"}; base score: ${ruleScore(student, b)}; already assigned: ${load.get(b.name).length}`).join("\n")}

Rules:
- Use ONLY the facts above. Never say two students share a club or background unless it is listed.
- Each score must stay within 10 points of that candidate's base score. Only near-perfect matches go above 90.
- If the best candidate still has no shared clubs or only two shared languages, say it needs a closer look.

Pick the single best buddy, then rate the next two best candidates. Reply with JSON only:
{"buddy": "<exact name from the list>", "score": <0-100 compatibility>, "why": "<one short sentence>",
 "explanation": "<two or three sentences for the staff reviewing this match>",
 "alternatives": [{"buddy": "<exact name>", "score": <0-100>, "reason": "<one sentence>"}, {"buddy": "<exact name>", "score": <0-100>, "reason": "<one sentence>"}]}`

const buddyPrompt = (buddy, assigned) => `A school pairs new students with a student "buddy".
Write a two or three sentence note for staff about this buddy's current assignments: who they are paired with, why those pairings work or are weak, and whether they have room for more students (two is a full load).

Buddy:
${describe(buddy)}

Assigned new students:
${assigned.length ? assigned.map((m) => `- ${m.student.name} (score ${m.score}): ${m.why}`).join("\n") : "- none yet"}

Use ONLY these facts; do not invent shared clubs, backgrounds or personal details. Call any score under ${FLAG_BELOW} weak.
Reply with JSON only: {"explanation": "<two or three sentences>"}`

// ---------- Run ----------
const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
const byName = (list, name) => list.find((c) => c.name.toLowerCase() === String(name || "").trim().toLowerCase())
const matches = []

console.log(`Matching ${newStudents.length} new students with ${buddies.length} buddies using ${MODEL}...\n`)
for (const s of newStudents) {
    const candidates = [...buddies]
        .sort((x, y) => ruleScore(s, y) - 5 * load.get(y.name).length - (ruleScore(s, x) - 5 * load.get(x.name).length))
        .slice(0, SHORTLIST)
    const result = await tryAI(matchPrompt(s, candidates), s.name)

    const b = byName(candidates, result?.buddy) || candidates[0]
    const clampScore = (x, base) => Math.round(Math.max(base - 10, Math.min(base + 10, 95, Number(x) || base)))
    const score = clampScore(result?.score, ruleScore(s, b))
    const why = ruleWhy(s, b)
    const explanation = result?.explanation || why

    // Other compatible buddies: the AI's picks if valid, otherwise the next best by rule score.
    const alts = []
    for (const a of Array.isArray(result?.alternatives) ? result.alternatives : []) {
        const c = byName(candidates, a?.buddy)
        if (c && c !== b && !alts.some((x) => x.c === c)) alts.push({ c, score: clampScore(a.score, ruleScore(s, c)), reason: ruleWhy(s, c) })
    }
    for (const c of candidates) {
        if (alts.length >= 2) break
        if (c !== b && !alts.some((x) => x.c === c)) alts.push({ c, score: ruleScore(s, c), reason: ruleWhy(s, c) })
    }

    const l = shared(s.langs, b.langs), cl = shared(s.clubs, b.clubs)
    const m = { student: s, buddy: b, score, why, explanation }
    load.get(b.name).push(m)
    matches.push({ ...m, row: [
        `${s.name} – ${b.name}`, slug(`${s.name} ${b.name}`), score, score < FLAG_BELOW, today, why, explanation,
        s.name, s.grade, s.langs.join(", "), s.clubs.join(", "), s.bio,
        b.name, b.grade, b.langs.join(", "), b.clubs.join(", "), b.bio,
        l.join(", ") || "None", cl.join(", ") || "None",
        s.interests, s.background, s.newness, b.interests, b.background, b.newness,
        alts.map((a) => `${a.c.name}|${a.score}|${String(a.reason).replace(/[|;]/g, ",")}`).join(" ;; "),
    ] })
    console.log(`${String(score).padStart(3)}  ${s.name} → ${b.name}   ${why}`)
}

// A 2-3 sentence "Why" for every student, shown beside Status on the Students page.
console.log("\nWriting buddy notes...")
const notes = new Map()
for (const m of matches) notes.set(m.student.name, `Paired with ${m.buddy.name} (${m.score}). ${m.explanation}`)
for (const b of buddies) {
    const assigned = load.get(b.name)
    const result = await tryAI(buddyPrompt(b, assigned), b.name)
    notes.set(b.name, result?.explanation || (assigned.length
        ? `Suggested buddy for ${assigned.map((m) => `${m.student.name} (${m.score})`).join(" and ")}. ${assigned.map((m) => m.why).join(" ")}`
        : `Not assigned yet. Speaks ${b.langs.join(", ")} and is in ${b.clubs.join(", ") || "no clubs"}, so is available for the next new student.`))
}

matches.sort((x, y) => y.score - x.score)
writeFileSync(output, toCsv([
    ["Title", "Slug", "Score", "Flagged", "Suggested", "Why", "Explanation",
     "New Student", "New Grade", "New Languages", "New Clubs", "New Bio",
     "Buddy", "Buddy Grade", "Buddy Languages", "Buddy Clubs", "Buddy Bio",
     "Shared Languages", "Shared Clubs",
     "New Interests", "New Background", "New Newness", "Buddy Interests", "Buddy Background", "Buddy Newness", "Alternatives"],
    ...matches.map((m) => m.row),
]))
writeFileSync(studentsOut, toCsv([
    ["Name", "Slug", "Grade", "Role", "Languages", "Clubs", "Status", "Explanation"],
    ...students.map((s) => [
        s.name, slug(s.name), s.grade, s.role === "new" ? "New" : "Buddy", s.langs.join(", "), s.clubs.join(", "),
        s.role === "new" ? "Matched, awaiting approval" : load.get(s.name).length ? "Suggested" : "Available",
        notes.get(s.name),
    ]),
]))
console.log(`\nSaved ${matches.length} matches to ${output} (import into Framer "Matches").`)
console.log(`Saved ${students.length} students to ${studentsOut} (import into Framer "Students").`)
