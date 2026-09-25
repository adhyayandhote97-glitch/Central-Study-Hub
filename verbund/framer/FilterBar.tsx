import { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// Verbund design tokens
// (colours come from the Masthead's light/dark theme, with light values as fallback)
const C = {
    bg: "var(--vb-bg, #F7F5F0)", surface: "var(--vb-surface, #FFFFFF)", border: "var(--vb-border, #DEDACD)", borderStrong: "var(--vb-border-strong, #B9B29B)",
    ink: "var(--vb-ink, #1C1A16)", soft: "var(--vb-soft, #5E594C)", faint: "var(--vb-faint, #8E8874)", accent: "var(--vb-accent, #9E2B25)", good: "var(--vb-good, #3C6B4A)",
}
const body = '"Source Serif 4", Georgia, serif'
const inner = { maxWidth: 1040, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px)", boxSizing: "border-box" as const }

const GRADES = [["all", "All grades"], ["9", "Grade 9"], ["10", "Grade 10"], ["11", "Grade 11"]]
const SORTS = [["high", "Highest score first"], ["low", "Lowest score first"]]
const ROLES = [["all", "Everyone"], ["new", "New students"], ["buddy", "Buddies"]]

// Tells every MatchRow / StudentRow on the page what to show.
function broadcast(filter) {
    ;(window as any).__verbundFilter = filter
    window.dispatchEvent(new Event("verbund-filter"))
}

/**
 * Grade / sort / role dropdowns. Put it above a list of MatchRows (Matching mode)
 * or StudentRows (Students mode) and they filter live.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function FilterBar(props) {
    const { mode, style } = props
    const [f, setF] = useState({ grade: "all", sort: "high", role: "all" })

    useEffect(() => {
        broadcast(mode === "Matching" ? { grade: f.grade, sort: f.sort } : { grade: f.grade, role: f.role })
    }, [f, mode])
    useEffect(() => () => broadcast({}), []) // reset when leaving the page

    const select = (key, options) => (
        <select
            value={f[key]}
            onChange={(e) => setF({ ...f, [key]: e.target.value })}
            style={{ border: `1px solid ${C.ink}`, borderRadius: 2, padding: "5px 8px", background: C.surface, color: C.ink, fontSize: 13, fontFamily: body }}
        >
            {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
    )
    const label = (text) => <span>{text}</span>

    return (
        <div style={{ ...style, width: "100%", background: C.bg, fontFamily: body }}>
            <div style={inner}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "24px 0 16px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: C.soft }}>
                    {label("Grade")}
                    {select("grade", GRADES)}
                    {mode === "Matching" ? label("Sort") : label("Role")}
                    {mode === "Matching" ? select("sort", SORTS) : select("role", ROLES)}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(FilterBar, {
    mode: { type: ControlType.Enum, options: ["Matching", "Students"], defaultValue: "Matching" },
})
