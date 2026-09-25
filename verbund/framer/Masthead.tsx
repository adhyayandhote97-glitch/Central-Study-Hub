import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// Verbund design tokens
// (colours come from the Masthead's light/dark theme, with light values as fallback)
const C = {
    bg: "var(--vb-bg, #F7F5F0)", surface: "var(--vb-surface, #FFFFFF)", border: "var(--vb-border, #DEDACD)", borderStrong: "var(--vb-border-strong, #B9B29B)",
    ink: "var(--vb-ink, #1C1A16)", soft: "var(--vb-soft, #5E594C)", faint: "var(--vb-faint, #8E8874)", accent: "var(--vb-accent, #9E2B25)", good: "var(--vb-good, #3C6B4A)",
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

const THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap');
:root {
    --vb-bg: #F7F5F0; --vb-surface: #FFFFFF; --vb-border: #DEDACD; --vb-border-strong: #B9B29B;
    --vb-ink: #1C1A16; --vb-soft: #5E594C; --vb-faint: #8E8874; --vb-accent: #9E2B25; --vb-good: #3C6B4A;
}
:root[data-vb-theme="dark"] {
    --vb-bg: #16140F; --vb-surface: #1F1C16; --vb-border: #34302A; --vb-border-strong: #4A453B;
    --vb-ink: #EDE8DC; --vb-soft: #B5AE9C; --vb-faint: #8A8472; --vb-accent: #D8574F; --vb-good: #7FB08E;
}
body { background: var(--vb-bg); }
`

function setTheme(theme) {
    document.documentElement.setAttribute("data-vb-theme", theme)
    try { localStorage.setItem("verbund-theme", theme) } catch (e) {}
}

/**
 * Top bar with logo, nav and the light/dark toggle. Put one at the top of every page and pick the active tab.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Masthead(props) {
    const { active, dashboardLink, studentsLink, matchingLink, reviewLink, style } = props
    const [theme, setThemeState] = useState("light")
    useEffect(() => {
        let saved = "light"
        try { saved = localStorage.getItem("verbund-theme") || "light" } catch (e) {}
        setTheme(saved)
        setThemeState(saved)
    }, [])
    const choose = (t) => { setTheme(t); setThemeState(t) }

    const items = [
        ["Dashboard", dashboardLink], ["Students", studentsLink],
        ["Matching", matchingLink], ["Review", reviewLink],
    ]
    const toggleBtn = (t, title, icon) => (
        <button
            title={title}
            onClick={() => choose(t)}
            style={{
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer",
                borderRadius: 2, border: `1px solid ${theme === t ? C.ink : C.borderStrong}`,
                background: theme === t ? C.ink : C.surface, color: theme === t ? C.bg : C.soft,
            }}
        >
            {icon}
        </button>
    )
    const sun = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    )
    const moon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <path d="M21 12.5A8.5 8.5 0 1111.5 3a7 7 0 009.5 9.5z" />
        </svg>
    )

    return (
        <div style={{ ...style, width: "100%", background: C.surface, borderBottom: `3px double ${C.ink}`, paddingTop: 24, fontFamily: body, color: C.ink, textAlign: "center", position: "relative" }}>
            <style>{THEME_CSS}</style>
            <div style={{ position: "absolute", top: 16, right: "clamp(16px, 4vw, 32px)", display: "flex", alignItems: "center", gap: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.faint }}>
                <div style={{ display: "flex", gap: 4 }}>
                    {toggleBtn("light", "Light mode", sun)}
                    {toggleBtn("dark", "Dark mode", moon)}
                </div>
                <span>Staff</span>
            </div>
            <div style={{ fontFamily: display, fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>
                Ver<span style={{ color: C.accent }}>bund</span>
            </div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em", color: C.faint, marginTop: 4 }}>
                Buddy Matching Gazette
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
