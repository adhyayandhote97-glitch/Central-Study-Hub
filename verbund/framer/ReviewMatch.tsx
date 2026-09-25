import { useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// Verbund design tokens
const C = {
    bg: "#F7F5F0", surface: "#FFFFFF", border: "#DEDACD", borderStrong: "#B9B29B",
    ink: "#1C1A16", soft: "#5E594C", faint: "#8E8874", accent: "#9E2B25", good: "#3C6B4A",
}
const display = '"Playfair Display", Georgia, serif'
const body = '"Source Serif 4", Georgia, serif'
const inner = { maxWidth: 1040, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px)", boxSizing: "border-box" as const }
const btn = (primary: boolean, small = false) => ({
    display: "inline-flex", alignItems: "center", padding: small ? "5px 12px" : "8px 16px",
    fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: body, textTransform: "uppercase" as const,
    letterSpacing: "0.04em", border: `1px solid ${primary ? C.accent : C.ink}`, borderRadius: 2,
    background: primary ? C.accent : "transparent", color: primary ? "#fff" : C.ink,
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" as const,
})

/**
 * The whole Review page for one match. Put it on the Matches CMS page and connect each property to a CMS field.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ReviewMatch(props) {
    const p = props
    const [decision, setDecision] = useState<null | "approved" | "declined">(null)
    const [popup, setPopup] = useState<null | { title: string; text: string; good: boolean }>(null)
    const [assigned, setAssigned] = useState<string | null>(null)
    const split = (s: string) => (s || "").split(",").map((x) => x.trim()).filter(Boolean)
    const mark = (list: string, shared: string) => {
        const hits = split(shared)
        const items = split(list)
        if (!items.length) return "—"
        return items.map((x, i) => (
            <span key={i}>
                {i > 0 && ", "}
                {hits.includes(x) ? <span style={{ color: C.accent, fontWeight: 700, fontStyle: "italic" }}>{x}</span> : x}
            </span>
        ))
    }
    const decide = (d) => {
        setDecision(d)
        setPopup(d === "approved"
            ? { title: "✓ Match approved", text: `${p.newStudent} and ${p.buddy} will be introduced this week.`, good: true }
            : { title: "Match declined", text: `${p.newStudent} will be offered a different buddy.`, good: false })
    }
    const assign = (name) => {
        setAssigned(name)
        setDecision("approved")
        setPopup({ title: "✓ Buddy reassigned", text: `${p.newStudent} is now paired with ${name}.`, good: true })
    }
    // "Name|score|reason ;; Name|score|reason"
    const alternatives = (p.alternatives || "").split(";;").map((x) => x.trim()).filter(Boolean).map((x) => {
        const [name, score, reason] = x.split("|").map((y) => (y || "").trim())
        return { name, score: Number(score) || 0, reason }
    })
    const card = { background: C.surface, border: `1px solid ${C.borderStrong}`, borderRadius: 2, padding: 24 }
    const label = { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: C.accent, fontWeight: 700 }
    const profile = (tag, name, grade, bio) => (
        <div style={card}>
            <div style={label}>{tag}</div>
            <h3 style={{ fontFamily: display, fontSize: 20, margin: "4px 0 0" }}>{name}</h3>
            <p style={{ margin: "2px 0 0", color: C.soft, fontSize: 13, fontStyle: "italic" }}>Grade {grade}</p>
            {bio && <p style={{ margin: "12px 0 0", color: C.soft, fontSize: 14, lineHeight: 1.55 }}>{bio}</p>}
        </div>
    )
    const rows = [
        ["Grade", `Grade ${p.newGrade}`, `Grade ${p.buddyGrade}`],
        ["Languages", mark(p.newLanguages, p.sharedLanguages), mark(p.buddyLanguages, p.sharedLanguages)],
        ["Clubs & activities", mark(p.newClubs, p.sharedClubs), mark(p.buddyClubs, p.sharedClubs)],
        ...[
            ["Interests", p.newInterests, p.buddyInterests],
            ["Family / background", p.newBackground, p.buddyBackground],
            ["Prior experience being new", p.newNewness, p.buddyNewness],
        ].filter(([, a, b]) => a || b).map(([k, a, b]) => [k, a || "—", b || "—"]),
        ["In common", <span style={{ color: C.accent, fontStyle: "italic" }}>{p.sharedLanguages}</span>, <span style={{ color: C.accent, fontStyle: "italic" }}>{p.sharedClubs}</span>],
    ]

    return (
        <div style={{ ...p.style, width: "100%", fontFamily: body, color: C.ink, lineHeight: 1.55 }}>
            <div style={{ ...inner, paddingBottom: 40 }}>
                <a href={p.backLink} style={{ display: "inline-block", marginTop: 24, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: C.soft, textDecoration: "none" }}>
                    ← Back to matching
                </a>

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "16px 0 24px", borderBottom: `1px solid ${C.borderStrong}` }}>
                    <div>
                        <h1 style={{ fontFamily: display, fontSize: 28, margin: 0, lineHeight: 1.2 }}>{p.newStudent} – {assigned || p.buddy}</h1>
                        <p style={{ margin: "8px 0 0", color: C.soft, fontSize: 15, fontStyle: "italic" }}>
                            Grade {p.newGrade} &amp; Grade {p.buddyGrade} — Suggested {p.suggested} by the matching model
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {decision ? (
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: decision === "approved" ? C.good : C.accent }}>
                                {assigned ? "✓ Reassigned" : decision === "approved" ? "✓ Approved" : "Declined"}
                            </span>
                        ) : (
                            <>
                                <button style={btn(false)} onClick={() => decide("declined")}>Decline</button>
                                <button style={btn(true)} onClick={() => decide("approved")}>Approve match</button>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32, marginTop: 24 }}>
                    <div style={{ width: 260, maxWidth: "100%" }}>
                        <div style={{ fontFamily: display, fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{p.score}</div>
                        <div style={{ height: 3, background: C.ink, marginTop: 12, width: `${p.score}%` }} />
                    </div>
                    <p style={{ flex: "1 1 300px", margin: 0, fontStyle: "italic", color: C.soft }}>{p.explanation}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 24 }}>
                    {profile("New student", p.newStudent, p.newGrade, p.newBio)}
                    {profile("Buddy", p.buddy, p.buddyGrade, p.buddyBio)}
                </div>

                <div style={{ marginTop: 24, overflowX: "auto" }}>
                    <div style={{ minWidth: 520 }}>
                        {[["Attribute", p.newStudent, p.buddy], ...rows].map(([a, x, y], i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "170px 1fr 1fr", gap: 16, padding: i === 0 ? "8px 0" : "16px 0", borderBottom: i === 0 ? `2px solid ${C.ink}` : `1px solid ${C.borderStrong}`, fontSize: i === 0 ? 11 : 14 }}>
                                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: i === 0 ? C.ink : C.soft, fontWeight: i === 0 ? 700 : 400 }}>{a}</div>
                                <div style={i === 0 ? { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 } : {}}>{x}</div>
                                <div style={i === 0 ? { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 } : {}}>{y}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {alternatives.length > 0 && (
                    <>
                        <div style={{ margin: "32px 0 0", paddingBottom: 8, borderBottom: `1px solid ${C.ink}`, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Other compatible buddies
                        </div>
                        {alternatives.map((a) => (
                            <div key={a.name} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 24, padding: "16px 0", borderBottom: `1px solid ${C.borderStrong}` }}>
                                <div style={{ width: 88, flexShrink: 0 }}>
                                    <div style={{ fontFamily: display, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{a.score}</div>
                                    <div style={{ height: 2, background: C.ink, marginTop: 8, width: `${a.score}%` }} />
                                </div>
                                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                                    <strong style={{ fontSize: 16 }}>{a.name}</strong>
                                    <div style={{ fontStyle: "italic", color: C.soft, fontSize: 14, marginTop: 4 }}>{a.reason}</div>
                                </div>
                                {assigned === a.name ? (
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.good }}>✓ Assigned</span>
                                ) : !decision ? (
                                    <button style={btn(false, true)} onClick={() => assign(a.name)}>Assign instead</button>
                                ) : null}
                            </div>
                        ))}
                    </>
                )}
            </div>

            {popup && (
                <div onClick={() => setPopup(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ ...card, maxWidth: 420, width: "100%", textAlign: "center", border: `1px solid ${C.ink}` }}>
                        <h2 style={{ fontFamily: display, fontSize: 24, margin: 0, color: popup.good ? C.good : C.accent }}>
                            {popup.title}
                        </h2>
                        <p style={{ margin: "8px 0 24px", color: C.soft, fontStyle: "italic" }}>
                            {popup.text}
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button style={btn(false)} onClick={() => setPopup(null)}>Stay here</button>
                            <a href={p.backLink} style={btn(true)}>Back to matching</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(ReviewMatch, {
    score: { type: ControlType.Number, defaultValue: 92, min: 0, max: 100 },
    suggested: { type: ControlType.String, defaultValue: "Aug 10" },
    explanation: { type: ControlType.String, displayTextArea: true, defaultValue: "Both speak Spanish, Marathi, Hindi, and English, and both play basketball. Aarav grew up in Pune and knows the city well, while Aayush moved here from Germany last year - a useful contrast for someone helping a new student settle in." },
    newStudent: { type: ControlType.String, title: "New student", defaultValue: "Aarav Subhedar" },
    newGrade: { type: ControlType.String, title: "New grade", defaultValue: "10" },
    newLanguages: { type: ControlType.String, title: "New languages", defaultValue: "Spanish, Marathi, Hindi, English" },
    newClubs: { type: ControlType.String, title: "New clubs", defaultValue: "Basketball" },
    newBio: { type: ControlType.String, title: "New bio", displayTextArea: true, defaultValue: "Has lived in Pune his entire life. Loves music and basketball, and doesn't have any siblings at home." },
    buddy: { type: ControlType.String, defaultValue: "Aayush Karade" },
    buddyGrade: { type: ControlType.String, title: "Buddy grade", defaultValue: "11" },
    buddyLanguages: { type: ControlType.String, title: "Buddy languages", defaultValue: "Spanish, Marathi, Hindi, English" },
    buddyClubs: { type: ControlType.String, title: "Buddy clubs", defaultValue: "Basketball" },
    buddyBio: { type: ControlType.String, title: "Buddy bio", displayTextArea: true, defaultValue: "Moved to India from Germany and has no siblings. Volunteered to be a buddy this term, having gone through the experience of arriving somewhere new himself." },
    sharedLanguages: { type: ControlType.String, title: "Shared languages", defaultValue: "Spanish, Marathi, Hindi, English" },
    sharedClubs: { type: ControlType.String, title: "Shared clubs", defaultValue: "Basketball" },
    newInterests: { type: ControlType.String, title: "New interests", defaultValue: "Basketball, music" },
    newBackground: { type: ControlType.String, title: "New background", defaultValue: "Lived in Pune his whole life, no siblings" },
    newNewness: { type: ControlType.String, title: "New newness", defaultValue: "Never moved before - this is Aarav's first time navigating something unfamiliar" },
    buddyInterests: { type: ControlType.String, title: "Buddy interests", defaultValue: "Basketball, settling into a new country" },
    buddyBackground: { type: ControlType.String, title: "Buddy background", defaultValue: "Moved from Germany, no siblings" },
    buddyNewness: { type: ControlType.String, title: "Buddy newness", defaultValue: "Moved internationally himself, understands what it's like to be the new one" },
    alternatives: {
        type: ControlType.String,
        displayTextArea: true,
        defaultValue: "Abhijit Tawri|88|Both speak Spanish, Marathi, Hindi, English, and share Basketball. ;; Purnendu Malani|78|Both speak Spanish, Marathi, Hindi, English, with no shared activities.",
    },
    backLink: { type: ControlType.Link, title: "Back link", defaultValue: "/matching" },
})
