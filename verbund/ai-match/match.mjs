// Verbund AI matching: reads students.csv, asks a local Ollama model to pick
// each new student's buddy, and writes matches.csv for the Framer CMS.
//
// Usage:  node match.mjs [students.csv] [matches.csv]
// Needs:  Node 18+, and Ollama running with a model pulled (default: llama3.2).
//         Change the model with:  MODEL=qwen2.5 node match.mjs

import { readFileSync, writeFileSync } from "node:fs"

const [input = "students.csv", output = "matches.csv"] = process.argv.slice(2)
const MODEL = process.env.MODEL || "llama3.2"
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
    bio: pick(r, "bio", "about", "background"),
})).filter((s) => s.name)

const newStudents = students.filter((s) => s.role === "new")
const buddies = students.filter((s) => s.role === "buddy")
if (!newStudents.length || !buddies.length) {
    console.error(`Need at least one New student and one Buddy in ${input} (check the Role column).`)
    process.exit(1)
}

// Quick rule-based score, used to shortlist candidates and as a fallback.
const load = new Map(buddies.map((b) => [b.name, 0]))
const ruleScore = (a, b) =>
    Math.min(95, 30 + 12 * shared(a.langs, b.langs).length + 10 * shared(a.clubs, b.clubs).length)

const describe = (s) =>
    `${s.name} (Grade ${s.grade}) - languages: ${s.langs.join(", ") || "none"}; clubs: ${s.clubs.join(", ") || "none"}` +
    (s.bio ? `; about: ${s.bio}` : "")

// ---------- Ollama ----------
async function askAI(student, candidates) {
    const prompt = `You match new students at a school with a student "buddy" who helps them settle in.
Shared languages matter most, then shared clubs/activities, then background (e.g. a buddy who was once new themselves).
Spread the load: prefer buddies with fewer students already assigned when candidates are close.

New student:
${describe(student)}

Candidate buddies:
${candidates.map((b) => `- ${describe(b)}; already assigned: ${load.get(b.name)}`).join("\n")}

Pick the single best buddy. Reply with JSON only:
{"buddy": "<exact name from the list>", "score": <0-100 compatibility>, "why": "<one short sentence>", "explanation": "<two or three sentences for the staff reviewing this match>"}`

    const res = await fetch(`${OLLAMA}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, stream: false, format: "json", messages: [{ role: "user", content: prompt }] }),
    })
    if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${await res.text()}`)
    return JSON.parse((await res.json()).message.content)
}

// ---------- Run ----------
const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
const matches = []

for (const s of newStudents) {
    const candidates = [...buddies]
        .sort((x, y) => ruleScore(s, y) - 5 * load.get(y.name) - (ruleScore(s, x) - 5 * load.get(x.name)))
        .slice(0, SHORTLIST)
    let result
    try {
        result = await askAI(s, candidates)
    } catch (e) {
        if (e.cause?.code === "ECONNREFUSED" || /fetch failed/.test(e.message)) {
            console.error(`Can't reach Ollama at ${OLLAMA}. Is the Ollama app running?`)
            process.exit(1)
        }
        console.warn(`  AI reply for ${s.name} was unusable (${e.message}); using the rule-based pick.`)
    }

    const b = candidates.find((c) => c.name.toLowerCase() === String(result?.buddy || "").trim().toLowerCase()) || candidates[0]
    const l = shared(s.langs, b.langs), c = shared(s.clubs, b.clubs)
    const fallbackWhy = `Both speak ${l.join(", ") || "no common language"}` + (c.length ? `, and share ${c.join(", ")}.` : ", with no shared activities.")
    const score = Math.round(Math.max(0, Math.min(100, Number(result?.score) || ruleScore(s, b))))
    const why = result?.why || fallbackWhy
    load.set(b.name, load.get(b.name) + 1)

    matches.push([
        `${s.name} – ${b.name}`, slug(`${s.name} ${b.name}`), score, score < FLAG_BELOW, today, why, result?.explanation || why,
        s.name, s.grade, s.langs.join(", "), s.clubs.join(", "), s.bio,
        b.name, b.grade, b.langs.join(", "), b.clubs.join(", "), b.bio,
        l.join(", ") || "None", c.join(", ") || "None",
    ])
    console.log(`${String(score).padStart(3)}  ${s.name} → ${b.name}   ${why}`)
}

matches.sort((x, y) => y[2] - x[2])
writeFileSync(output, toCsv([
    ["Title", "Slug", "Score", "Flagged", "Suggested", "Why", "Explanation",
     "New Student", "New Grade", "New Languages", "New Clubs", "New Bio",
     "Buddy", "Buddy Grade", "Buddy Languages", "Buddy Clubs", "Buddy Bio",
     "Shared Languages", "Shared Clubs"],
    ...matches,
]))
console.log(`\nSaved ${matches.length} matches to ${output}. Import it into the Framer "Matches" collection.`)
