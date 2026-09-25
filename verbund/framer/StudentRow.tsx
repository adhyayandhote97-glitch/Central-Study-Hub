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

const COLS: [string, number][] = [
    ["Name", 18], ["Grade", 6], ["Languages", 26], ["Clubs & activities", 20], ["Role", 8], ["Status", 22],
]

/**
 * One row of the Students table. Turn on "Header" for the column titles row.
 * Put the normal version inside a Collection List of "Students".
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function StudentRow(props) {
    const { header, name, grade, languages, clubs, role, status, style } = props
    const cells = header ? COLS.map((c) => c[0]) : [name, String(grade), languages, clubs, role, status]
    const statusColor = /matched|reassigned|approved/i.test(status) ? C.good : C.soft
    return (
        <div style={{ ...style, width: "100%", fontFamily: body, color: C.ink }}>
            <div style={inner}>
                <div style={{
                    display: "flex", gap: 12, alignItems: "center",
                    padding: header ? "8px 0" : "12px 0",
                    borderBottom: header ? `2px solid ${C.ink}` : `1px solid ${C.borderStrong}`,
                    fontSize: header ? 11 : 14, fontWeight: header ? 700 : 400,
                    textTransform: header ? "uppercase" : "none", letterSpacing: header ? "0.06em" : "normal",
                }}>
                    {cells.map((text, i) => (
                        <div key={i} style={{
                            flex: `${COLS[i][1]} 1 0`, minWidth: 0,
                            color: header ? C.ink : i === 2 || i === 3 ? C.soft : i === 5 ? statusColor : C.ink,
                            fontStyle: !header && i === 5 ? "italic" : "normal",
                        }}>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(StudentRow, {
    header: { type: ControlType.Boolean, defaultValue: false },
    name: { type: ControlType.String, defaultValue: "Aarav Subhedar", hidden: (p) => p.header },
    grade: { type: ControlType.Number, defaultValue: 10, hidden: (p) => p.header },
    languages: { type: ControlType.String, defaultValue: "Spanish, Marathi, Hindi, English", hidden: (p) => p.header },
    clubs: { type: ControlType.String, defaultValue: "Basketball", hidden: (p) => p.header },
    role: { type: ControlType.String, defaultValue: "New", hidden: (p) => p.header },
    status: { type: ControlType.String, defaultValue: "Matched, awaiting approval", hidden: (p) => p.header },
})
