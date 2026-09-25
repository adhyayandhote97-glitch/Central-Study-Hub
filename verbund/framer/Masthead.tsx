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
 * Top bar with logo and nav. Put one at the top of every page and pick the active tab.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Masthead(props) {
    const { active, dashboardLink, studentsLink, matchingLink, reviewLink, style } = props
    const items = [
        ["Dashboard", dashboardLink], ["Students", studentsLink],
        ["Matching", matchingLink], ["Review", reviewLink],
    ]
    return (
        <div style={{ ...style, width: "100%", background: C.surface, borderBottom: `3px double ${C.ink}`, paddingTop: 24, fontFamily: body, color: C.ink, textAlign: "center" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap');`}</style>
            <div style={{ fontFamily: display, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>
                Ver<span style={{ color: C.accent }}>bund</span>
            </div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em", color: C.faint, marginTop: 4 }}>
                Buddy Matching Gazette · Staff
            </div>
            <nav style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 24, marginTop: 16, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                {items.map(([label, href]) => {
                    const on = label === active
                    return (
                        <a key={label} href={href} style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", color: on ? C.accent : C.soft, borderBottom: `2px solid ${on ? C.accent : "transparent"}`, paddingBottom: 2 }}>
                            {label}
                        </a>
                    )
                })}
            </nav>
        </div>
    )
}

addPropertyControls(Masthead, {
    active: { type: ControlType.Enum, title: "Active tab", options: ["Dashboard", "Students", "Matching", "Review"], defaultValue: "Dashboard" },
    dashboardLink: { type: ControlType.Link, title: "Dashboard link", defaultValue: "/" },
    studentsLink: { type: ControlType.Link, title: "Students link", defaultValue: "/students" },
    matchingLink: { type: ControlType.Link, title: "Matching link", defaultValue: "/matching" },
    reviewLink: { type: ControlType.Link, title: "Review link", defaultValue: "/matches/aarav-subhedar-aayush-karade" },
})
