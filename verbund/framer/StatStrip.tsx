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
 * The four big numbers on the Dashboard, plus the "Pending matches" heading under them.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function StatStrip(props) {
    const { n1, l1, n2, l2, n3, l3, n4, l4, sectionTitle, linkLabel, link, style } = props
    const stats = [[n1, l1], [n2, l2], [n3, l3], [n4, l4]]
    return (
        <div style={{ ...style, width: "100%", fontFamily: body, color: C.ink }}>
            <div style={inner}>
                <div style={{ display: "flex", flexWrap: "wrap", rowGap: 16, padding: "24px 0", borderBottom: `1px solid ${C.borderStrong}`, marginBottom: 32 }}>
                    {stats.map(([n, l], i) => (
                        <div key={i} style={{ padding: i === 0 ? "0 24px 0 0" : "0 24px", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ display: "block", fontFamily: display, fontSize: 30, fontWeight: 700, color: C.accent }}>{n}</span>
                            <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: C.soft, marginTop: 2 }}>{l}</span>
                        </div>
                    ))}
                </div>
                {sectionTitle && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 8, borderBottom: `1px solid ${C.ink}` }}>
                        <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{sectionTitle}</span>
                        {linkLabel && <a href={link} style={{ fontSize: 12, color: C.accent, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>{linkLabel}</a>}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(StatStrip, {
    n1: { type: ControlType.String, title: "Number 1", defaultValue: "8" },
    l1: { type: ControlType.String, title: "Label 1", defaultValue: "Pending matches" },
    n2: { type: ControlType.String, title: "Number 2", defaultValue: "9" },
    l2: { type: ControlType.String, title: "Label 2", defaultValue: "New students this term" },
    n3: { type: ControlType.String, title: "Number 3", defaultValue: "94%" },
    l3: { type: ControlType.String, title: "Label 3", defaultValue: "Approved without edits" },
    n4: { type: ControlType.String, title: "Number 4", defaultValue: "3" },
    l4: { type: ControlType.String, title: "Label 4", defaultValue: "Flagged for review" },
    sectionTitle: { type: ControlType.String, title: "Section title", defaultValue: "Pending matches" },
    linkLabel: { type: ControlType.String, title: "Link text", defaultValue: "View all 8 →" },
    link: { type: ControlType.Link, title: "Link", defaultValue: "/matching" },
})
