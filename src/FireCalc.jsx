import { useState, useEffect, useRef } from "react";

const GROWTH_RATE = 0.07;
const SAFE_WITHDRAWAL = 0.04;

function fmt(n) {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1000)    return "$" + Math.round(n / 1000) + "K";
  return "$" + Math.round(n).toLocaleString("en-AU");
}

function yearsToFI(currentSavings, annualSavings, fiNumber) {
  if (annualSavings <= 0) return null;
  if (currentSavings >= fiNumber) return 0;
  const r = GROWTH_RATE;
  // Solve: currentSavings*(1+r)^n + annualSavings*((1+r)^n - 1)/r = fiNumber
  for (let n = 1; n <= 100; n++) {
    const projected = currentSavings * Math.pow(1 + r, n) + annualSavings * ((Math.pow(1 + r, n) - 1) / r);
    if (projected >= fiNumber) return n;
  }
  return null;
}

function projectWealth(currentSavings, annualSavings, years) {
  const r = GROWTH_RATE;
  return currentSavings * Math.pow(1 + r, years) + annualSavings * ((Math.pow(1 + r, years) - 1) / r);
}

function BarChart({ data, accent }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
      {data.map((d, i) => {
        const h = Math.round((d.v / max) * 72);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
            <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: d.fi ? accent : accent + "44", height: h, transition: "height 0.6s cubic-bezier(0.34,1.1,0.64,1)" }} title={fmt(d.v)} />
            {d.label && <div style={{ fontSize: 8, color: "rgba(240,237,230,0.3)", whiteSpace: "nowrap" }}>{d.label}</div>}
          </div>
        );
      })}
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
          <div><div style={th}>Tools</div>{[{l:"Net Worth Calculator",p:"calculator"},{l:"Income Calculator",p:"income"},{l:"Super Checker",p:"super"},{l:"Wealth Forecaster",p:"forecast"},{l:"FIRE Calculator",p:"fire"}].map(i=><button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>)}</div>
          <div><div style={th}>Info</div>{[{l:"About the Data",p:"about"},{l:"Insights",p:"insights"},{l:"Disclaimer",p:"disclaimer"}].map(i=><button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>)}</div>
        </div>
        <div style={{ borderTop: "1px solid rgba(240,237,230,0.05)", paddingTop: 16, fontSize: 10, color: "rgba(240,237,230,0.18)" }}>
          © 2026 WealthRank AU · For informational purposes only · Not financial advice
        </div>
      </div>
    </footer>
  );
}

export default function FireCalc({ setPage }) {
  const accent = "#A78BD4";

  const [form, setForm] = useState({
    income: "",
    expenses: "",
    savings: "",
    currentInvested: "",
  });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (v) => parseFloat(String(v).replace(/,/g, "")) || 0;

  function calculate() {
    const income   = num(form.income);
    const expenses = num(form.expenses);
    const invested = num(form.currentInvested);
    if (!income || !expenses) return;

    const annualSavings = income - expenses;
    const savingsRate   = income > 0 ? (annualSavings / income) * 100 : 0;
    const fiNumber      = expenses * 25;
    const coastNumber   = expenses * 12; // rough coast FI (enough to coast to 60)
    const years         = yearsToFI(invested, annualSavings, fiNumber);
    const coastYears    = yearsToFI(invested, annualSavings, coastNumber);

    // Build chart data — project each year up to FI or 40 years
    const chartYears = Math.min((years || 40) + 2, 42);
    const chartData = [];
    for (let y = 0; y <= chartYears; y += Math.ceil(chartYears / 10)) {
      chartData.push({
        v: projectWealth(invested, Math.max(annualSavings, 0), y),
        label: y === 0 ? "Now" : `Yr ${y}`,
        fi: years !== null && y >= years,
      });
    }

    // Savings rate benchmarks
    let srVerdict, srColor;
    if (savingsRate >= 50)      { srVerdict = "FIRE territory";   srColor = "#5BA08A"; }
    else if (savingsRate >= 30) { srVerdict = "Strong saver";     srColor = accent; }
    else if (savingsRate >= 20) { srVerdict = "Above average";    srColor = "#7EB8D4"; }
    else if (savingsRate >= 10) { srVerdict = "Average";          srColor = "#E8C05A"; }
    else                        { srVerdict = "Below average";    srColor = "#E8935A"; }

    setResult({ income, expenses, annualSavings, savingsRate, fiNumber, coastNumber, years, coastYears, invested, chartData, srVerdict, srColor });
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "rgba(13,27,42,0.6)",
    border: "1px solid rgba(240,237,230,0.12)", borderRadius: 9, padding: "11px 14px",
    color: "#F0EDE6", fontSize: 15, fontWeight: 600, outline: "none",
  };
  const labelStyle = { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.38)", marginBottom: 6, fontWeight: 600, display: "block" };

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "12px 24px 0" }}>
        <button onClick={() => setPage("tools")} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.35)", fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span> All Tools
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "52px 24px 40px", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, marginBottom: 10, fontWeight: 600 }}>Australian Wealth Index</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Savings Rate & FIRE Calculator</h1>
        <p style={{ fontSize: 14, color: "rgba(240,237,230,0.45)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>Enter your income and expenses to find your financial independence number, how many years until you can retire, and whether you're on the FIRE path.</p>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "32px 24px 0" }}>

        {!result && (
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.08)", borderRadius: 16, padding: "26px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Annual income (after tax)</label>
                <input style={inputStyle} type="text" placeholder="e.g. 85,000" value={form.income} onChange={e => sf("income", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Annual expenses</label>
                <input style={inputStyle} type="text" placeholder="e.g. 55,000" value={form.expenses} onChange={e => sf("expenses", e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Current invested assets (optional)</label>
              <input style={inputStyle} type="text" placeholder="e.g. 40,000 — shares, ETFs, savings" value={form.currentInvested} onChange={e => sf("currentInvested", e.target.value)} />
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.25)", marginTop: 5 }}>Excludes super (inaccessible until 60) and property equity</div>
            </div>
            <button
              onClick={calculate}
              style={{ width: "100%", padding: "14px", background: accent, color: "#0D1B2A", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              Calculate my FIRE number
            </button>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.2)", textAlign: "center", marginTop: 10 }}>Nothing stored · Calculated in your browser · Assumes 7% annual growth</div>

            {/* What is FIRE explainer */}
            <div style={{ marginTop: 24, background: "rgba(167,139,212,0.06)", border: "1px solid rgba(167,139,212,0.15)", borderRadius: 12, padding: "16px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, fontWeight: 700, marginBottom: 8 }}>What is FIRE?</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", lineHeight: 1.75 }}>
                <strong style={{ color: "rgba(240,237,230,0.75)" }}>Financial Independence, Retire Early</strong> — the idea that once you have 25× your annual expenses invested, your portfolio can sustain withdrawals of 4% indefinitely. Your savings rate is the single biggest lever: saving 50% of income typically leads to FI in ~17 years regardless of income level.
              </div>
            </div>
          </div>
        )}

        {result && (
          <div>
            {/* Savings rate verdict */}
            <div style={{ background: result.srColor + "12", border: `1px solid ${result.srColor}33`, borderRadius: 16, padding: "22px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: 8 }}>Your savings rate</div>
              <div style={{ fontSize: "clamp(32px,7vw,52px)", fontWeight: 900, color: result.srColor, letterSpacing: "-0.02em", marginBottom: 4 }}>
                {result.savingsRate > 0 ? Math.round(result.savingsRate) + "%" : "0%"}
              </div>
              <div style={{ display: "inline-block", background: result.srColor + "22", color: result.srColor, border: `1px solid ${result.srColor}44`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{result.srVerdict}</div>
              <div style={{ fontSize: 13, color: "rgba(240,237,230,0.45)" }}>
                {result.annualSavings >= 0
                  ? <>Saving {fmt(result.annualSavings)}/yr on {fmt(result.income)} income</>
                  : <span style={{ color: "#E8935A" }}>Expenses exceed income by {fmt(Math.abs(result.annualSavings))}/yr</span>
                }
              </div>
            </div>

            {/* Key numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Your FI number", val: fmt(result.fiNumber), sub: "25× annual expenses", color: accent },
                { label: "Years to FI", val: result.years !== null ? result.years + " yrs" : "100+ yrs", sub: result.years !== null ? `Retire around age ${new Date().getFullYear() - 1990 + result.years}` : "Increase savings rate", color: result.years !== null && result.years <= 20 ? "#5BA08A" : result.years !== null && result.years <= 35 ? "#E8C05A" : "#E8935A" },
                { label: "Annual FI income", val: fmt(result.expenses), sub: "4% withdrawal from FI number", color: "rgba(240,237,230,0.7)" },
                { label: "Current portfolio", val: fmt(result.invested), sub: result.invested > 0 ? fmt(result.fiNumber - result.invested) + " to go" : "Enter above to track gap", color: "rgba(240,237,230,0.7)" },
              ].map(s => (
                <div key={s.label} style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.32)", marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 3 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.28)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Projection chart */}
            {result.annualSavings > 0 && (
              <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: 4 }}>Wealth projection</div>
                <div style={{ fontSize: 11, color: "rgba(240,237,230,0.3)", marginBottom: 14 }}>
                  Darker bars = FI achieved · Target: {fmt(result.fiNumber)}
                </div>
                <BarChart data={result.chartData} accent={accent} />
              </div>
            )}

            {/* Coast FIRE */}
            {result.coastYears !== null && result.coastYears < (result.years || 100) && (
              <div style={{ background: "rgba(91,160,138,0.06)", border: "1px solid rgba(91,160,138,0.2)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5BA08A", fontWeight: 700, marginBottom: 8 }}>Coast FIRE in {result.coastYears} years</div>
                <div style={{ fontSize: 13, color: "rgba(240,237,230,0.55)", lineHeight: 1.7 }}>
                  After {result.coastYears} year{result.coastYears !== 1 ? "s" : ""} you'll have enough invested that compound growth alone — with no further contributions — will carry your portfolio to your FI number by retirement age. At that point you only need to earn enough to cover living expenses.
                </div>
              </div>
            )}

            {/* Savings rate table */}
            <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: 14 }}>What if you saved more?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                {[["Savings rate", "Annual saving", "Years to FI"],
                  ...([10,20,30,40,50,60].map(sr => {
                    const as = result.income * (sr / 100);
                    const exp = result.income - as;
                    const fi = exp * 25;
                    const yrs = yearsToFI(result.invested, as, fi);
                    const isYou = Math.abs(result.savingsRate - sr) < 5;
                    return [sr + "%", fmt(as) + "/yr", yrs !== null ? yrs + " yrs" : "100+", isYou];
                  }))
                ].map((row, ri) => (
                  row.slice(0,3).map((cell, ci) => (
                    <div key={ci} style={{
                      padding: "9px 10px",
                      fontSize: ri === 0 ? 9 : 12,
                      fontWeight: ri === 0 ? 700 : (ci === 0 && row[3] ? 700 : 400),
                      color: ri === 0 ? "rgba(240,237,230,0.28)" : row[3] ? accent : ci === 2 ? "rgba(240,237,230,0.75)" : "rgba(240,237,230,0.5)",
                      background: row[3] ? accent + "10" : ri % 2 === 0 ? "transparent" : "rgba(240,237,230,0.01)",
                      textTransform: ri === 0 ? "uppercase" : "none",
                      letterSpacing: ri === 0 ? "0.08em" : "normal",
                      borderBottom: ri < 6 ? "1px solid rgba(240,237,230,0.04)" : "none",
                    }}>{cell}</div>
                  ))
                ))}
              </div>
              {result.savingsRate > 0 && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.25)", marginTop: 10 }}>Highlighted row is closest to your current savings rate. Assumes 7% growth and expenses adjust proportionally.</div>}
            </div>

            {/* Australian context */}
            <div style={{ background: "rgba(232,147,90,0.06)", border: "1px solid rgba(232,147,90,0.15)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E8935A", fontWeight: 700, marginBottom: 8 }}>Australian FIRE note</div>
              <div style={{ fontSize: 12, color: "rgba(240,237,230,0.52)", lineHeight: 1.75 }}>
                Super is inaccessible until preservation age (currently 60). Most Australian FIRE practitioners need <strong style={{ color: "#F0EDE6" }}>two portfolios</strong>: a non-super portfolio to bridge the gap between early retirement and 60, and super to fund the rest. This calculator covers your non-super portfolio only. Your super balance — currently growing with employer contributions — is a separate tailwind from age 60.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <button style={{ flex: 1, padding: "12px", background: "transparent", color: accent, border: `2px solid ${accent}`, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                onClick={() => { navigator.clipboard.writeText(`My FIRE number is ${fmt(result.fiNumber)} — ${result.years !== null ? result.years + " years away" : "keep saving!"} at a ${Math.round(result.savingsRate)}% savings rate. Calculated at WealthRank AU.`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>
                {copied ? "✓ Copied!" : "Share my result"}
              </button>
              <button style={{ flex: 1, padding: "12px", background: "transparent", color: "rgba(240,237,230,0.3)", border: "1px solid rgba(240,237,230,0.09)", borderRadius: 10, fontSize: 13, cursor: "pointer" }} onClick={() => setResult(null)}>
                ← Recalculate
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: 9, color: "rgba(240,237,230,0.16)", margin: "20px 0 32px", letterSpacing: "0.05em" }}>FOR INFORMATIONAL USE ONLY · NOT FINANCIAL ADVICE · ASSUMES 7% ANNUAL GROWTH, NO TAX OR FEES</div>
          </div>
        )}
      </div>

      <PageFooter setPage={setPage} />
    </>
  );
}
