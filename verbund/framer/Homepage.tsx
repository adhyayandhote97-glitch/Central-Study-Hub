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
    display: "inline-flex", alignItems: "center", padding: small ? "5px 12px" : "10px 20px",
    fontSize: small ? 11 : 13, fontWeight: 600, fontFamily: body, textTransform: "uppercase" as const,
    letterSpacing: "0.04em", border: `1px solid ${primary ? C.accent : C.ink}`, borderRadius: 2,
    background: primary ? C.accent : "transparent", color: primary ? "#fff" : C.ink,
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" as const,
})
const kicker = { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: C.accent, fontWeight: 700 }
const sectionHead = { margin: "56px 0 24px", paddingBottom: 8, borderBottom: `1px solid ${C.ink}`, fontSize: 14, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em" }

const STEPS = [
    ["I", "Collect", "Students fill in a short form: grade, languages, clubs and a little about themselves. Answers land in a sheet staff can export as CSV."],
    ["II", "Match", "A local AI model (Qwen 2.5, run through Ollama) shortlists buddies by shared languages and clubs, then picks the best fit and explains why."],
    ["III", "Review", "Staff see every suggestion with its score and reasoning. Weak pairings are flagged. Approve, decline or assign a different buddy in one click."],
    ["IV", "Introduce", "Approved pairs are introduced in the first week, so no new student spends their first days without someone to turn to."],
]
const FEATURES = [
    ["Every match is explained", "No black box. Each pairing shows the shared languages and activities behind it, plus a short written explanation for staff."],
    ["Data stays at school", "The AI runs on a school computer, not in the cloud. Student details are never sent to an outside service."],
    ["Weak matches are flagged", "Pairings that score under 75 are marked for a closer look, so staff spend their time where it matters."],
    ["Staff stay in charge", "Nothing is final until a teacher approves it. The AI suggests; people decide."],
]

/**
 * The public homepage: what Verbund is, how it works, and a way into the staff dashboard.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Homepage(props) {
    const { headline, subheadline, dashboardLink, formLink, stat1, stat1Label, stat2, stat2Label, stat3, stat3Label, showQuote, showFeatures, style } = props
    const stats = [[stat1, stat1Label], [stat2, stat2Label], [stat3, stat3Label]]

    return (
        <div style={{ ...style, width: "100%", background: C.bg, fontFamily: body, color: C.ink, lineHeight: 1.55 }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap');`}</style>

            {/* Nameplate */}
            <div style={{ background: C.surface, borderBottom: `3px double ${C.ink}` }}>
                <div style={{ ...inner, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px clamp(16px, 4vw, 32px)" }}>
                    <div>
                        <div style={{ fontFamily: display, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
                            Ver<span style={{ color: C.accent }}>bund</span>
                        </div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.faint, marginTop: 4 }}>Buddy Matching Gazette</div>
                    </div>
                    <a href={dashboardLink} style={btn(false, true)}>Staff dashboard →</a>
                </div>
            </div>

            <div style={inner}>
                {/* Hero */}
                <div style={{ padding: "56px 0 40px", borderBottom: `1px solid ${C.borderStrong}`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "end" }}>
                    <div>
                        <div style={kicker}>For new students and the staff who welcome them</div>
                        <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.08, margin: "12px 0 0" }}>{headline}</h1>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: 18, fontStyle: "italic", color: C.soft }}>{subheadline}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
                            <a href={dashboardLink} style={btn(true)}>Open staff dashboard</a>
                            {formLink && <a href={formLink} target="_blank" rel="noreferrer" style={btn(false)}>Student sign-up form</a>}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", flexWrap: "wrap", rowGap: 16, padding: "24px 0", borderBottom: `1px solid ${C.borderStrong}` }}>
                    {stats.map(([n, l], i) => (
                        <div key={i} style={{ padding: i === 0 ? "0 32px 0 0" : "0 32px", borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ display: "block", fontFamily: display, fontSize: 34, fontWeight: 700, color: C.accent }}>{n}</span>
                            <span style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: C.soft }}>{l}</span>
                        </div>
                    ))}
                </div>

                {/* How it works */}
                <div style={sectionHead}>How it works</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
                    {STEPS.map(([num, title, text]) => (
                        <div key={num} style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 16 }}>
                            <div style={{ fontFamily: display, fontSize: 28, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{num}</div>
                            <h3 style={{ fontFamily: display, fontSize: 20, margin: "8px 0 8px" }}>{title}</h3>
                            <p style={{ margin: 0, fontSize: 15, color: C.soft }}>{text}</p>
                        </div>
                    ))}
                </div>

                {showQuote && (
                    <>
                {/* Pull quote */}
                <div style={{ margin: "56px 0 0", padding: "32px 0", borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, textAlign: "center" }}>
                    <p style={{ fontFamily: display, fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.3, margin: "0 auto", maxWidth: 760 }}>
                        “The first week decides whether a new student feels like a visitor or like they belong.”
                    </p>
                    <p style={{ margin: "12px 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: C.faint }}>Why we built Verbund</p>
                </div>

                    </>
                )}

                {showFeatures && (
                    <>
                {/* Features */}
                <div style={sectionHead}>Why schools use it</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 24 }}>
                    {FEATURES.map(([title, text]) => (
                        <div key={title} style={{ background: C.surface, border: `1px solid ${C.borderStrong}`, borderRadius: 2, padding: 24 }}>
                            <h3 style={{ fontFamily: display, fontSize: 19, margin: 0 }}>{title}</h3>
                            <p style={{ margin: "8px 0 0", fontSize: 15, color: C.soft }}>{text}</p>
                        </div>
                    ))}
                </div>

                    </>
                )}

                {/* Closing call to action */}
                <div style={{ margin: "56px 0 0", padding: "40px 0 56px", borderTop: `3px double ${C.ink}`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                    <div>
                        <h2 style={{ fontFamily: display, fontSize: 28, margin: 0 }}>Ready to review this term's matches?</h2>
                        <p style={{ margin: "6px 0 0", color: C.soft, fontStyle: "italic" }}>Suggestions are waiting for staff approval.</p>
                    </div>
                    <a href={dashboardLink} style={btn(true)}>Go to the dashboard</a>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(Homepage, {
    headline: { type: ControlType.String, defaultValue: "Every new student deserves a friend on day one." },
    subheadline: {
        type: ControlType.String, displayTextArea: true,
        defaultValue: "Verbund pairs each new student with a buddy who shares their languages and interests. An AI model suggests the matches and explains them; staff approve every one.",
    },
    dashboardLink: { type: ControlType.Link, title: "Dashboard link", defaultValue: "/dashboard" },
    formLink: { type: ControlType.Link, title: "Sign-up form link", defaultValue: "" },
    stat1: { type: ControlType.String, title: "Number 1", defaultValue: "14" },
    stat1Label: { type: ControlType.String, title: "Label 1", defaultValue: "Students this term" },
    stat2: { type: ControlType.String, title: "Number 2", defaultValue: "9" },
    stat2Label: { type: ControlType.String, title: "Label 2", defaultValue: "Matches suggested" },
    stat3: { type: ControlType.String, title: "Number 3", defaultValue: "4" },
    stat3Label: { type: ControlType.String, title: "Label 3", defaultValue: "Flagged for review" },
    showQuote: { type: ControlType.Boolean, title: "Show quote", defaultValue: false },
    showFeatures: { type: ControlType.Boolean, title: "Show 'Why schools use it'", defaultValue: false },
})
