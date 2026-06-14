import { useState, useRef, useEffect } from "react";

const SUPER_MEDIANS = {
  "18-24": { median: 5000,  avg: 27000  },
  "25-34": { median: 22000, avg: 62000  },
  "35-44": { median: 65000, avg: 137000 },
  "45-54": { median: 130000,avg: 214000 },
  "55-64": { median: 195000,avg: 283000 },
  "65+":   { median: 265000,avg: 310000 },
};

const ASFA_SINGLE  = 595000;
const ASFA_COUPLE  = 690000;
const GROWTH_RATE  = 0.07;
const SG_RATE      = 0.11;
const RETIREMENT   = 67;

function getAgeGroup(age) {
  const n = parseInt(age);
  if (n <= 24) return "18-24";
  if (n <= 34) return "25-34";
  if (n <= 44) return "35-44";
  if (n <= 54) return "45-54";
  if (n <= 64) return "55-64";
  return "65+";
}

function fmt(n) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1000)    return "$" + Math.round(n / 1000) + "K";
  return "$" + Math.round(n).toLocaleString("en-AU");
}

function projectSuper(currentBalance, annualIncome, yearsToRetirement) {
  const r = GROWTH_RATE;
  const contrib = annualIncome * SG_RATE;
  if (yearsToRetirement <= 0) return currentBalance;
  return currentBalance * Math.pow(1 + r, yearsToRetirement) +
    contrib * ((Math.pow(1 + r, yearsToRetirement) - 1) / r);
}

function catchUpNeeded(currentBalance, annualIncome, yearsToRetirement, target) {
  const projected = projectSuper(currentBalance, annualIncome, yearsToRetirement);
  const gap = target - projected;
  if (gap <= 0) return { gap: 0, monthly: 0 };
  const r = GROWTH_RATE;
  const monthly = gap / (((Math.pow(1 + r, yearsToRetirement) - 1) / r) * 12);
  return { gap, monthly };
}

function GaugeBar({ pct, color, label }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(pct, 100)), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(240,237,230,0.45)" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ background: "rgba(13,27,42,0.8)", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ width: w + "%", height: "100%", background: color, borderRadius: 6, transition: "width 1s cubic-bezier(0.34,1.1,0.64,1)" }} />
      </div>
    </div>
  );
}

function PageFooter({ setPage }) {
  const lnk = { display: "block", fontSize: 12, color: "rgba(240,237,230,0.4)", cursor: "pointer", marginBottom: 7, background: "none", border: "none", padding: 0, textAlign: "left" };
  const th  = { fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.28)", marginBottom: 10 };
  return (
    <footer style={{ borderTop: "1px solid rgba(240,237,230,0.06)", marginTop: 64, padding: "44px 24px 28px", background: "#0a1628" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 28, marginBottom: 36 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Wealth<span style={{ color: "#E8935A" }}>Rank</span><span style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginLeft: 3, fontWeight: 400 }}>AU</span></div>
            <p style={{ fontSize: 12, color: "rgba(240,237,230,0.32)", lineHeight: 1.7, maxWidth: 200, margin: "0 0 12px" }}>Free, data-driven tools to help Australians understand their financial position.</p>
          </div>
          <div><div style={th}>Tools</div>{[{l:"Net Worth Calculator",p:"calculator"},{l:"Income Calculator",p:"income"},{l:"Super Checker",p:"super"},{l:"Wealth Forecaster",p:"forecast"},{l:"By Generation",p:"gen"}].map(i=><button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>)}</div>
          <div><div style={th}>Info</div>{[{l:"About the Data",p:"about"},{l:"Insights",p:"insights"},{l:"Disclaimer",p:"disclaimer"}].map(i=><button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>)}</div>
        </div>
        <div style={{ borderTop: "1px solid rgba(240,237,230,0.05)", paddingTop: 16, fontSize: 10, color: "rgba(240,237,230,0.18)" }}>
          © 2026 WealthRank AU · For informational purposes only · Not financial advice · Data: ATO · ASFA
        </div>
      </div>
    </footer>
  );
}

export default function SuperChecker({ setPage }) {
  const accent = "#7EB8D4";

  const [form, setForm]     = useState({ age: "", balance: "", income: "65000", type: "single" });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function calculate() {
    const age     = parseInt(form.age);
    const balance = parseFloat(String(form.balance).replace(/,/g, "")) || 0;
    const income  = parseFloat(String(form.income).replace(/,/g, "")) || 65000;
    if (!age || age < 18 || age > 85) return;

    const ageGroup = getAgeGroup(age);
    const medians  = SUPER_MEDIANS[ageGroup];
    const ytr      = Math.max(RETIREMENT - age, 0);
    const target   = form.type === "couple" ? ASFA_COUPLE : ASFA_SINGLE;

    const projected = projectSuper(balance, income, ytr);
    const { gap, monthly } = catchUpNeeded(balance, income, ytr, target);

    const vsMedian = medians.median > 0 ? (balance / medians.median) * 100 : 0;
    const vsTarget = target > 0 ? (projected / target) * 100 : 0;

    let verdict, verdictColor, verdictBg;
    if (age >= 65) {
      verdict = balance >= target ? "On track" : "Below target";
      verdictColor = balance >= target ? "#5BA08A" : "#E8935A";
      verdictBg    = balance >= target ? "rgba(91,160,138,0.1)" : "rgba(232,147,90,0.1)";
    } else if (vsMedian >= 130) {
      verdict = "Well ahead";
      verdictColor = "#5BA08A";
      verdictBg    = "rgba(91,160,138,0.1)";
    } else if (vsMedian >= 85) {
      verdict = "On track";
      verdictColor = "#7EB8D4";
      verdictBg    = "rgba(126,184,212,0.1)";
    } else if (vsMedian >= 50) {
      verdict = "Slightly behind";
      verdictColor = "#E8C05A";
      verdictBg    = "rgba(232,192,90,0.1)";
    } else {
      verdict = "Behind";
      verdictColor = "#E8935A";
      verdictBg    = "rgba(232,147,90,0.1)";
    }

    const currentYearContrib = income * SG_RATE;

    setResult({ age, ageGroup, balance, income, ytr, target, projected, gap, monthly, medians, vsMedian, vsTarget, verdict, verdictColor, verdictBg, currentYearContrib });
  }

  function share() {
    if (!result) return;
    const txt = `My super is ${result.verdict.toLowerCase()} — ${fmt(result.balance)} at age ${result.age}. Check yours at WealthRank AU.`;
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "rgba(13,27,42,0.6)",
    border: "1px solid rgba(240,237,230,0.12)", borderRadius: 9, padding: "11px 14px",
    color: "#F0EDE6", fontSize: 15, fontWeight: 600, outline: "none",
  };
  const labelStyle = { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.38)", marginBottom: 6, fontWeight: 600 };
  const segBtn = (active) => ({
    flex: 1, padding: "10px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
    background: active ? accent + "22" : "transparent",
    color: active ? accent : "rgba(240,237,230,0.4)",
    borderRadius: 9, transition: "all 0.15s",
  });

  return (
    <>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 24px 0" }}>
        <button onClick={() => setPage("tools")} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.35)", fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span> All Tools
        </button>
      </div>
      <div style={{ textAlign: "center", padding: "52px 24px 40px", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: 10, fontWeight: 600 }}>Australian Wealth Index</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Super on Track Checker</h1>
        <p style={{ fontSize: 14, color: "rgba(240,237,230,0.45)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>See how your super balance compares to Australians your age — and whether you're on track for the ASFA comfortable retirement standard.</p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px 0" }}>

        {!result && (
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.08)", borderRadius: 16, padding: "26px" }}>
            <div style={labelStyle}>Retirement type</div>
            <div style={{ display: "flex", background: "rgba(13,27,42,0.8)", border: "1px solid rgba(240,237,230,0.1)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <button style={segBtn(form.type === "single")} onClick={() => sf("type", "single")}>Single</button>
              <button style={segBtn(form.type === "couple")} onClick={() => sf("type", "couple")}>Couple</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <div style={labelStyle}>Your age</div>
                <input style={inputStyle} type="number" min={18} max={85} placeholder="e.g. 38" value={form.age} onChange={e => sf("age", e.target.value)} />
              </div>
              <div>
                <div style={labelStyle}>Super balance</div>
                <input style={inputStyle} type="text" placeholder="e.g. 85,000" value={form.balance} onChange={e => sf("balance", e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle}>Annual income (pre-tax)</div>
              <input style={inputStyle} type="text" placeholder="e.g. 90,000" value={form.income} onChange={e => sf("income", e.target.value)} />
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.25)", marginTop: 5 }}>Used to estimate future employer contributions (11% SG rate)</div>
            </div>

            <button
              onClick={calculate}
              style={{ width: "100%", padding: "14px", background: accent, color: "#0D1B2A", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              Check my super            </button>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.2)", textAlign: "center", marginTop: 10 }}>Nothing stored · Calculated in your browser</div>
          </div>
        )}

        {result && (
          <div>
            {/* Verdict */}
            <div style={{ background: result.verdictBg, border: `1px solid ${result.verdictColor}33`, borderRadius: 16, padding: "22px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: 8 }}>Your super status</div>
              <div style={{ fontSize: "clamp(28px,6vw,42px)", fontWeight: 900, color: result.verdictColor, letterSpacing: "-0.02em", marginBottom: 6 }}>{result.verdict}</div>
              <div style={{ fontSize: 13, color: "rgba(240,237,230,0.5)", lineHeight: 1.6 }}>
                {result.balance > 0
                  ? <>{fmt(result.balance)} at age {result.age} — {result.vsMedian >= 100 ? "above" : "below"} the {result.ageGroup} median of {fmt(result.medians.median)}</>
                  : <>No super balance entered</>
                }
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Your balance", val: fmt(result.balance), color: accent },
                { label: `Median (ages ${result.ageGroup})`, val: fmt(result.medians.median), color: "rgba(240,237,230,0.6)" },
                { label: result.ytr > 0 ? `Projected at ${67}` : "Current vs target", val: fmt(result.projected), color: result.vsTarget >= 100 ? "#5BA08A" : "#E8C05A" },
                { label: `ASFA ${result.target === ASFA_COUPLE ? "couple" : "single"} target`, val: fmt(result.target), color: "rgba(240,237,230,0.6)" },
              ].map(s => (
                <div key={s.label} style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.32)", marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Progress bars */}
            <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: 14 }}>How you compare</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <GaugeBar pct={result.vsMedian} color={result.vsMedian >= 100 ? "#5BA08A" : accent} label={`vs. ${result.ageGroup} median (${fmt(result.medians.median)})`} />
                <GaugeBar pct={result.vsTarget} color={result.vsTarget >= 100 ? "#5BA08A" : "#E8C05A"} label={`Projected balance vs ASFA target (${fmt(result.target)})`} />
              </div>
            </div>

            {/* Catch-up plan */}
            {result.ytr > 0 && result.gap > 0 && (
              <div style={{ background: "rgba(232,147,90,0.06)", border: "1px solid rgba(232,147,90,0.18)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E8935A", marginBottom: 10, fontWeight: 700 }}>Catch-up plan</div>
                <div style={{ fontSize: 13, color: "rgba(240,237,230,0.58)", lineHeight: 1.7, marginBottom: 12 }}>
                  Your employer contributions of {fmt(result.currentYearContrib)}/yr project your super to <strong style={{ color: "#F0EDE6" }}>{fmt(result.projected)}</strong> by age 67 — <strong style={{ color: "#E8935A" }}>{fmt(result.gap)}</strong> short of the ASFA target.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(13,27,42,0.5)", borderRadius: 9, padding: "12px" }}>
                    <div style={{ fontSize: 9, color: "rgba(240,237,230,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Extra monthly to close gap</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#E8935A" }}>{fmt(result.monthly)}<span style={{ fontSize: 11, fontWeight: 400, color: "rgba(240,237,230,0.4)" }}>/mo</span></div>
                  </div>
                  <div style={{ background: "rgba(13,27,42,0.5)", borderRadius: 9, padding: "12px" }}>
                    <div style={{ fontSize: 9, color: "rgba(240,237,230,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Years to retirement</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#F0EDE6" }}>{result.ytr}<span style={{ fontSize: 11, fontWeight: 400, color: "rgba(240,237,230,0.4)" }}> yrs</span></div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "rgba(240,237,230,0.3)", lineHeight: 1.6 }}>
                  Concessional contributions are taxed at 15% instead of your marginal rate — up to $27,500/yr including employer SG. If your balance is under $500K, unused cap from the past 5 years can be carried forward.
                </div>
              </div>
            )}

            {result.ytr > 0 && result.gap <= 0 && (
              <div style={{ background: "rgba(91,160,138,0.06)", border: "1px solid rgba(91,160,138,0.2)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5BA08A", marginBottom: 8, fontWeight: 700 }}>On track for a comfortable retirement</div>
                <div style={{ fontSize: 13, color: "rgba(240,237,230,0.58)", lineHeight: 1.7 }}>
                  At your current employer SG rate, your projected balance of <strong style={{ color: "#5BA08A" }}>{fmt(result.projected)}</strong> exceeds the ASFA comfortable retirement standard of <strong style={{ color: "#F0EDE6" }}>{fmt(result.target)}</strong>. Keep it up — and review again if your income or circumstances change.
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg,#1a2e42,#142133)", border: `1px solid ${accent}33`, borderRadius: 12, padding: "18px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: 6 }}>Super is only part of the picture</div>
              <div style={{ fontSize: 13, color: "rgba(240,237,230,0.55)", lineHeight: 1.7, marginBottom: 12 }}>See your full net worth percentile — property, shares, cash, and debts included.</div>
              <button onClick={() => setPage("calculator")} style={{ padding: "10px 20px", background: "#E8935A", color: "#0D1B2A", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Calculate Net Worth Rank</button>
            </div>

            <button style={{ width: "100%", padding: "12px", background: "transparent", color: accent, border: `2px solid ${accent}`, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }} onClick={share}>{copied ? "✓ Copied!" : "Share my result"}</button>
            <button style={{ width: "100%", padding: "10px", background: "transparent", color: "rgba(240,237,230,0.3)", border: "1px solid rgba(240,237,230,0.09)", borderRadius: 10, fontSize: 12, cursor: "pointer" }} onClick={() => setResult(null)}>← Recalculate</button>

            <div style={{ textAlign: "center", fontSize: 9, color: "rgba(240,237,230,0.16)", margin: "20px 0 32px", letterSpacing: "0.05em" }}>DATA: ATO · ASFA · FOR INFORMATIONAL USE ONLY · NOT FINANCIAL ADVICE</div>
          </div>
        )}
      </div>

      <PageFooter setPage={setPage} />
    </>
  );
}
