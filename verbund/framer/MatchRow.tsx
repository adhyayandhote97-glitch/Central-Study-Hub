import { useState, useEffect, useRef } from "react"
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

// Listens to the FilterBar and hides / reorders this row inside its CMS list.
function useFilter(ref, apply) {
    useEffect(() => {
        const run = () => {
            let item = ref.current
            while (item && item.parentElement && item.parentElement.children.length < 2) item = item.parentElement
            if (item) apply(item, (window as any).__verbundFilter || {})
        }
        run()
        window.addEventListener("verbund-filter", run)
        return () => window.removeEventListener("verbund-filter", run)
    })
}

/**
 * One suggested pair. Put it inside a Collection List of "Matches" and connect each property to a CMS field.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function MatchRow(props) {
    const { score, newStudent, buddy, why, slug, basePath, grade, style } = props
    const [approved, setApproved] = useState(false)
    const ref = useRef(null)
    useFilter(ref, (item, f) => {
        item.style.display = f.grade && f.grade !== "all" && String(grade) !== f.grade ? "none" : ""
        item.style.order = f.sort ? String(f.sort === "low" ? score : -score) : ""
    })
    const person = (label, name) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 150 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.faint }}>{label}</span>
            <strong style={{ fontSize: 16 }}>{name}</strong>
        </div>
    )
    return (
        <div ref={ref} style={{ ...style, width: "100%", fontFamily: body, color: C.ink }}>
            <div style={inner}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 24, padding: "16px 0", borderBottom: `1px solid ${C.borderStrong}` }}>
                    <div style={{ width: 88, flexShrink: 0 }}>
                        <div style={{ fontFamily: display, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{score}</div>
                        <div style={{ height: 2, background: C.ink, marginTop: 8, width: `${score}%` }} />
                    </div>
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
                            {person("New student", newStudent)}
                            <div style={{ width: 1, alignSelf: "stretch", minHeight: 30, background: C.borderStrong }} />
                            {person("Buddy", buddy)}
                        </div>
                        <div style={{ fontStyle: "italic", color: C.soft, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>{why}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <a href={basePath + slug} style={btn(false, true)}>Review</a>
                        <button
                            onClick={() => setApproved(!approved)}
                            style={{ ...btn(true, true), ...(approved ? { background: C.good, borderColor: C.good } : {}) }}
                        >
                            {approved ? "✓ Approved" : "Approve"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MatchRow, {
    score: { type: ControlType.Number, defaultValue: 92, min: 0, max: 100 },
    newStudent: { type: ControlType.String, title: "New student", defaultValue: "Aarav Subhedar" },
    buddy: { type: ControlType.String, defaultValue: "Aayush Karade" },
    why: { type: ControlType.String, displayTextArea: true, defaultValue: "Both speak Spanish, Marathi, Hindi, and English, and both play basketball." },
    slug: { type: ControlType.String, defaultValue: "aarav-subhedar-aayush-karade" },
    basePath: { type: ControlType.String, title: "Review page path", defaultValue: "/matches/" },
    grade: { type: ControlType.String, title: "New grade", defaultValue: "10" },
})
