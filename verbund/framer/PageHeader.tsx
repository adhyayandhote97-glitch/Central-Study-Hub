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
 * Page title, subtitle, up to two buttons, and an optional section heading underneath.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function PageHeader(props) {
    const { title, subtitle, secondaryLabel, secondaryLink, primaryLabel, primaryLink, sectionTitle, style } = props
    const Btn = ({ label, link, primary }) =>
        !label ? null : link
            ? <a href={link} style={btn(primary)}>{label}</a>
            : <button style={btn(primary)}>{label}</button>
    return (
        <div style={{ ...style, width: "100%", fontFamily: body, color: C.ink }}>
            <div style={inner}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "32px 0 24px", borderBottom: `1px solid ${C.borderStrong}` }}>
                    <div>
                        <h1 style={{ fontFamily: display, fontSize: 32, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{title}</h1>
                        {subtitle && <p style={{ margin: "8px 0 0", color: C.soft, fontSize: 15, fontStyle: "italic" }}>{subtitle}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <Btn label={secondaryLabel} link={secondaryLink} primary={false} />
                        <Btn label={primaryLabel} link={primaryLink} primary={true} />
                    </div>
                </div>
                {sectionTitle && (
                    <div style={{ margin: "24px 0 0", paddingBottom: 8, borderBottom: `1px solid ${C.ink}`, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {sectionTitle}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(PageHeader, {
    title: { type: ControlType.String, defaultValue: "Dashboard" },
    subtitle: { type: ControlType.String, defaultValue: "Fall term buddy matching is open" },
    secondaryLabel: { type: ControlType.String, title: "Button 1", defaultValue: "View students" },
    secondaryLink: { type: ControlType.Link, title: "Button 1 link", defaultValue: "/students" },
    primaryLabel: { type: ControlType.String, title: "Button 2", defaultValue: "Review matches" },
    primaryLink: { type: ControlType.Link, title: "Button 2 link", defaultValue: "/matching" },
    sectionTitle: { type: ControlType.String, title: "Section title", defaultValue: "" },
})
