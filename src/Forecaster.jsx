import { useState, useEffect, useRef, useCallback } from "react";

const fmt = (n) => {
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
  return "$" + Math.round(n).toLocaleString("en-AU");
};
const pm = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

const ABS_PERCENTILES = {
  all: { 10:13000,20:55000,30:130000,40:220000,50:350000,60:520000,70:730000,80:1050000,90:1650000,95:2500000,99:5200000 },
  "18-24": { 10:1000,20:5000,30:12000,40:22000,50:35000,60:55000,70:85000,80:130000,90:210000,95:320000,99:650000 },
  "25-34": { 10:5000,20:22000,30:50000,40:90000,50:145000,60:220000,70:330000,80:490000,90:750000,95:1100000,99:2200000 },
  "35-44": { 10:15000,20:65000,30:145000,40:260000,50:420000,60:620000,70:870000,80:1200000,90:1850000,95:2700000,99:5000000 },
  "45-54": { 10:20000,20:90000,30:210000,40:380000,50:620000,60:900000,70:1250000,80:1750000,90:2700000,95:3900000,99:7500000 },
  "55-64": { 10:25000,20:110000,30:270000,40:490000,50:790000,60:1150000,70:1600000,80:2200000,90:3300000,95:4800000,99:9000000 },
  "65+":   { 10:50000,20:180000,30:380000,40:620000,50:900000,60:1250000,70:1700000,80:2350000,90:3500000,95:5000000,99:9500000 },
};

function getAgeGroup(age) {
  const a = parseInt(age);
  if (a <= 24) return "18-24"; if (a <= 34) return "25-34"; if (a <= 44) return "35-44";
  if (a <= 54) return "45-54"; if (a <= 64) return "55-64"; return "65+";
}

function calcPercentile(nw, ageGroup) {
  const pts = ABS_PERCENTILES[ageGroup] || ABS_PERCENTILES.all;
  const keys = [10,20,30,40,50,60,70,80,90,95,99];
  if (nw <= 0) return 5;
  if (nw < pts[10]) return Math.round((nw / pts[10]) * 10);
  for (let i = 0; i < keys.length - 1; i++) {
    const lo = keys[i], hi = keys[i+1];
    if (nw >= pts[lo] && nw < pts[hi]) return Math.round(lo + ((nw - pts[lo]) / (pts[hi] - pts[lo])) * (hi - lo));
  }
  return Math.round(99 + Math.min((nw - pts[99]) / pts[99], 1) * 0.9);
}

// Project wealth year by year
function projectWealth(inputs, events) {
  const { age, property, super: superBal, investments, cash, mortgage, otherDebt,
    propGrowth, superReturn, investReturn, inflation,
    monthlySavings, superContrib, retireAge } = inputs;

  const years = Math.max(retireAge - parseInt(age), 1);
  const r_prop = propGrowth / 100;
  const r_super = superReturn / 100;
  const r_invest = investReturn / 100;
  const r_inf = inflation / 100;

  let results = [];
  let prop = property, sup = superBal, inv = investments, csh = cash;
  let mort = mortgage, debt = otherDebt;
  const annualSavings = monthlySavings * 12;
  const annualSuper = superContrib * 12;

  for (let y = 0; y <= years; y++) {
    const currentAge = parseInt(age) + y;
    // Apply life events for this year
    const yearEvents = events.filter(e => parseInt(e.age) === currentAge);
    yearEvents.forEach(ev => {
      if (ev.type === "property_buy") { prop += pm(ev.amount); mort += pm(ev.debt); }
      else if (ev.type === "property_sell") { prop -= pm(ev.amount); mort = Math.max(0, mort - pm(ev.debt)); }
      else if (ev.type === "inheritance") { csh += pm(ev.amount); }
      else if (ev.type === "career_break") { csh -= pm(ev.amount); }
      else if (ev.type === "pay_debt") { const amt = pm(ev.amount); csh = Math.max(0, csh - amt); mort = Math.max(0, mort - amt); }
      else if (ev.type === "lump_sum") { inv += pm(ev.amount); }
    });

    const nw = prop + sup + inv + csh - mort - debt;
    const ageGrp = getAgeGroup(currentAge);
    const pct = calcPercentile(nw, ageGrp);

    // Confidence bands: bear (-2%), base, bull (+2%)
    const bear_nw = prop * 0.97 + sup * 0.96 + inv * 0.96 + csh - mort - debt;
    const bull_nw = prop * 1.03 + sup * 1.02 + inv * 1.02 + csh - mort - debt;

    results.push({ year: y, age: currentAge, nw, pct, bear: bear_nw, bull: bull_nw, prop, sup, inv, csh, mort, debt });

    // Grow assets for next year
    prop *= (1 + r_prop);
    sup = (sup + annualSuper) * (1 + r_super);
    inv = (inv + annualSavings * 0.6) * (1 + r_invest);
    csh = csh + annualSavings * 0.4;
    mort = Math.max(0, mort * 0.97); // approximate mortgage paydown
    debt = Math.max(0, debt * 0.9);
  }
  return results;
}

// Projection line chart using canvas
function ForecastChart({ data, dataB=[], showBands, showBreakdown, accentColor }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const PAD = { top: 20, right: 30, bottom: 40, left: 70 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxNW = Math.max(...data.map(d => showBands ? d.bull : d.nw)) * 1.1;
    const minNW = Math.min(0, Math.min(...data.map(d => showBands ? d.bear : d.nw)));
    const range = maxNW - minNW;

    const xScale = (i) => PAD.left + (i / (data.length - 1)) * chartW;
    const yScale = (v) => PAD.top + chartH - ((v - minNW) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = "rgba(240,237,230,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      const val = maxNW - (i / 4) * range;
      ctx.fillStyle = "rgba(240,237,230,0.3)";
      ctx.font = "10px system-ui"; ctx.textAlign = "right";
      ctx.fillText(fmt(val), PAD.left - 6, y + 4);
    }

    // X axis labels
    ctx.fillStyle = "rgba(240,237,230,0.3)";
    ctx.font = "10px system-ui"; ctx.textAlign = "center";
    data.forEach((d, i) => {
      if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        ctx.fillText(d.age, xScale(i), H - PAD.bottom + 16);
      }
    });
    ctx.fillText("Age", W / 2, H - 4);

    // Confidence band
    if (showBands && data.length > 1) {
      ctx.beginPath();
      data.forEach((d, i) => { i === 0 ? ctx.moveTo(xScale(i), yScale(d.bull)) : ctx.lineTo(xScale(i), yScale(d.bull)); });
      data.slice().reverse().forEach((d, i) => { ctx.lineTo(xScale(data.length - 1 - i), yScale(d.bear)); });
      ctx.closePath();
      ctx.fillStyle = accentColor + "18";
      ctx.fill();
    }

    // Breakdown lines (property, super, investments)
    if (showBreakdown) {
      const streams = [
        { key: "prop", color: "#5BA08A", label: "Property" },
        { key: "sup", color: "#7EB8D4", label: "Super" },
        { key: "inv", color: "#E8C05A", label: "Investments" },
      ];
      streams.forEach(s => {
        ctx.beginPath();
        data.forEach((d, i) => { i === 0 ? ctx.moveTo(xScale(i), yScale(d[s.key])) : ctx.lineTo(xScale(i), yScale(d[s.key])); });
        ctx.strokeStyle = s.color + "88";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Main net worth line
    ctx.beginPath();
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(xScale(i), yScale(d.nw)) : ctx.lineTo(xScale(i), yScale(d.nw)); });
    const grad = ctx.createLinearGradient(PAD.left, 0, W - PAD.right, 0);
    grad.addColorStop(0, accentColor + "99");
    grad.addColorStop(1, accentColor);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Area fill under main line
    ctx.beginPath();
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(xScale(i), yScale(d.nw)) : ctx.lineTo(xScale(i), yScale(d.nw)); });
    ctx.lineTo(xScale(data.length - 1), yScale(0));
    ctx.lineTo(xScale(0), yScale(0));
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
    areaGrad.addColorStop(0, accentColor + "28");
    areaGrad.addColorStop(1, accentColor + "04");
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Zero line
    if (minNW < 0) {
      const zy = yScale(0);
      ctx.beginPath(); ctx.moveTo(PAD.left, zy); ctx.lineTo(W - PAD.right, zy);
      ctx.strokeStyle = "rgba(240,237,230,0.2)"; ctx.lineWidth = 1; ctx.stroke();
    }

    // Scenario B line
    if (dataB.length > 1) {
      ctx.beginPath();
      dataB.forEach((d, i) => { i === 0 ? ctx.moveTo(xScale(i), yScale(d.nw)) : ctx.lineTo(xScale(i), yScale(d.nw)); });
      ctx.strokeStyle = "#5BA08A";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      // End dot B
      const lastB = dataB[dataB.length-1];
      ctx.beginPath();
      ctx.arc(xScale(dataB.length-1), yScale(lastB.nw), 4, 0, Math.PI*2);
      ctx.fillStyle = "#5BA08A"; ctx.fill();
    }
    // End dot
    const last = data[data.length - 1];
    ctx.beginPath();
    ctx.arc(xScale(data.length - 1), yScale(last.nw), 5, 0, Math.PI * 2);
    ctx.fillStyle = accentColor; ctx.fill();
    ctx.beginPath();
    ctx.arc(xScale(data.length - 1), yScale(last.nw), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();

    // Start dot
    ctx.beginPath();
    ctx.arc(xScale(0), yScale(data[0].nw), 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(240,237,230,0.5)"; ctx.fill();

  }, [data, dataB, showBands, showBreakdown, accentColor]);

  return <canvas ref={ref} width={700} height={320} style={{ width: "100%", height: "auto", display: "block" }} />;
}

const EVENT_TYPES = [
  { value: "property_buy", label: "Buy property" },
  { value: "property_sell", label: "Sell property" },
  { value: "inheritance", label: "Inheritance / windfall" },
  { value: "career_break", label: "Career break / reduced income" },
  { value: "pay_debt", label: "Pay off debt lump sum" },
  { value: "lump_sum", label: "Lump sum investment" },
];

const DEFAULT_INPUTS = {
  age: "35", retireAge: 67,
  property: "600000", super: "85000", investments: "50000", cash: "30000",
  mortgage: "350000", otherDebt: "0",
  propGrowth: 4, superReturn: 7, investReturn: 7, inflation: 2.5,
  monthlySavings: 1000, superContrib: 600,
};
const DEFAULT_SCENARIO_B = {
  monthlySavings: 1500, superContrib: 900,
  propGrowth: 4, superReturn: 7, investReturn: 7,
};



function PageFooter({setPage}){
  const lnk={display:"block",fontSize:12,color:"rgba(240,237,230,0.4)",cursor:"pointer",marginBottom:7,background:"none",border:"none",padding:0,textAlign:"left"};
  const th={fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(240,237,230,0.28)",marginBottom:10};
  return(
    <footer style={{borderTop:"1px solid rgba(240,237,230,0.06)",marginTop:64,padding:"44px 24px 28px",background:"#0a1628"}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:28,marginBottom:36}}>
          <div>
            <div style={{fontWeight:800,fontSize:15,marginBottom:8,color:"#F0EDE6"}}>Wealth<span style={{color:"#E8935A"}}>Rank</span><span style={{fontSize:10,color:"rgba(240,237,230,0.3)",marginLeft:3,fontWeight:400}}>AU</span></div>
            <p style={{fontSize:12,color:"rgba(240,237,230,0.32)",lineHeight:1.7,maxWidth:200,margin:"0 0 12px"}}>Free, data-driven tools to help Australians understand their financial position.</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["No data stored","Free to use"].map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"rgba(240,237,230,0.26)"}}>
                  <div style={{width:3,height:3,borderRadius:"50%",background:"#5BA08A"}}/>{t}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={th}>Tools</div>
            {[{l:"Net Worth",p:"calculator"},{l:"Income Calculator",p:"income"},{l:"Forecaster",p:"forecast"},{l:"By Generation",p:"gen"},{l:"Insights",p:"insights"}].map(i=>(
              <button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>
            ))}
          </div>
          <div>
            <div style={th}>Information</div>
            {[{l:"About the Data",p:"about"},{l:"Data Sources",p:"about"},{l:"Changelog",p:"about"}].map(i=>(
              <button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>
            ))}
          </div>
          <div>
            <div style={th}>Legal</div>
            {[{l:"Privacy Policy",p:"privacy"},{l:"Disclaimer",p:"disclaimer"},{l:"Terms of Use",p:"terms"}].map(i=>(
              <button key={i.l} style={lnk} onClick={()=>setPage(i.p)}>{i.l}</button>
            ))}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(240,237,230,0.05)",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:10,color:"rgba(240,237,230,0.18)"}}>© 2026 WealthRank AU. For informational purposes only. Not financial advice.</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:10,color:"rgba(240,237,230,0.18)"}}>Data: ABS · ASFA</div>
            <div style={{fontSize:9,background:"rgba(91,160,138,0.12)",color:"#5BA08A",border:"1px solid rgba(91,160,138,0.2)",borderRadius:4,padding:"2px 5px",fontWeight:600}}>v1.4</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Forecaster({ setPage }) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [events, setEvents] = useState([]);
  const [showBands, setShowBands] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showNominal, setShowNominal] = useState(true);
  const [showScenario, setShowScenario] = useState(false);
  const [scenarioB, setScenarioB] = useState(DEFAULT_SCENARIO_B);
  const [activeTab, setActiveTab] = useState("starting");
  const [newEvent, setNewEvent] = useState({ age: "", type: "property_buy", amount: "", debt: "" });
  const [showAddEvent, setShowAddEvent] = useState(false);

  const si = (k, v) => setInputs(p => ({ ...p, [k]: v }));

  const baseInputs = {
    ...inputs,
    property: pm(inputs.property), super: pm(inputs.super),
    investments: pm(inputs.investments), cash: pm(inputs.cash),
    mortgage: pm(inputs.mortgage), otherDebt: pm(inputs.otherDebt),
  };
  const data = projectWealth(baseInputs, events);
  const dataB = showScenario ? projectWealth({
    ...baseInputs,
    monthlySavings: scenarioB.monthlySavings,
    superContrib: scenarioB.superContrib,
    propGrowth: scenarioB.propGrowth,
    superReturn: scenarioB.superReturn,
    investReturn: scenarioB.investReturn,
  }, events) : [];

  const retireData = data[data.length - 1] || {};
  const currentNW = data[0]?.nw || 0;
  const retireNW = retireData.nw || 0;
  const retirePct = retireData.pct || 0;
  const currentPct = data[0]?.pct || 0;
  const ASFA_TARGET = 595000;
  const retireScore = Math.min(100, Math.round((retireNW / ASFA_TARGET) * 60 + (retirePct / 100) * 40));
  const yearsToRetire = Math.max(0, inputs.retireAge - parseInt(inputs.age));
  const accentColor = "#A78BD4";

  const addEvent = () => {
    if (!newEvent.age || !newEvent.amount) return;
    setEvents(e => [...e, { ...newEvent, id: Date.now() }]);
    setNewEvent({ age: "", type: "property_buy", amount: "", debt: "" });
    setShowAddEvent(false);
  };

  const removeEvent = (id) => setEvents(e => e.filter(ev => ev.id !== id));

  const inp = { width: "100%", background: "rgba(13,27,42,0.8)", border: "1px solid rgba(240,237,230,0.12)", borderRadius: 8, padding: "10px 12px", color: "#F0EDE6", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const slab = { display: "block", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: 5, fontWeight: 600 };
  const tabBtn = (active) => ({ padding: "8px 14px", border: "none", background: active ? accentColor + "22" : "transparent", color: active ? accentColor : "rgba(240,237,230,0.4)", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", borderBottom: `2px solid ${active ? accentColor : "transparent"}` });

  return (
    <div style={{ paddingBottom: 0 }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 24px 0" }}>
        <button onClick={() => setPage("tools")} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.35)", fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span> All Tools
        </button>
      </div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "52px 24px 40px", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: accentColor, marginBottom: 10, fontWeight: 600 }}>Australian Wealth Index</div>
        <h1 style={{ fontSize: "clamp(24px,5vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Wealth Forecaster</h1>
        <p style={{ fontSize: 14, color: "rgba(240,237,230,0.45)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>See where your wealth is headed. Model multiple asset streams, add life events, and find your retirement readiness score.</p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 0", display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

        {/* Left panel — inputs */}
        <div style={{ position: "sticky", top: 72 }}>
          {/* Tab nav */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(13,27,42,0.6)", borderRadius: 10, padding: 4 }}>
            {[{ id: "starting", l: "Starting point" }, { id: "contributions", l: "Contributions" }, { id: "assumptions", l: "Assumptions" }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...tabBtn(activeTab === t.id), flex: 1, fontSize: 11, padding: "7px 8px" }}>{t.l}</button>
            ))}
          </div>

          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.08)", borderRadius: 14, padding: "20px" }}>
            {activeTab === "starting" && (
              <div>
                <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Starting Point</div>
                <div style={{ marginBottom: 12 }}><label style={slab}>Current Age</label><input style={inp} type="number" min="18" max="80" value={inputs.age} onChange={e => si("age", e.target.value)} /></div>
                <div style={{ marginBottom: 12 }}><label style={slab}>Target Retirement Age</label><input style={inp} type="number" min="50" max="80" value={inputs.retireAge} onChange={e => si("retireAge", parseInt(e.target.value))} /></div>
                <div style={{ height: 1, background: "rgba(240,237,230,0.06)", margin: "16px 0" }} />
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Assets</div>
                {[{ k: "property", l: "Property value" }, { k: "super", l: "Superannuation" }, { k: "investments", l: "Shares / investments" }, { k: "cash", l: "Cash & savings" }].map(f => (
                  <div key={f.k} style={{ marginBottom: 10 }}><label style={slab}>{f.l}</label><input style={inp} type="text" placeholder="0" value={inputs[f.k]} onChange={e => si(f.k, e.target.value)} /></div>
                ))}
                <div style={{ height: 1, background: "rgba(240,237,230,0.06)", margin: "16px 0" }} />
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Liabilities</div>
                {[{ k: "mortgage", l: "Mortgage outstanding" }, { k: "otherDebt", l: "Other debt" }].map(f => (
                  <div key={f.k} style={{ marginBottom: 10 }}><label style={slab}>{f.l}</label><input style={inp} type="text" placeholder="0" value={inputs[f.k]} onChange={e => si(f.k, e.target.value)} /></div>
                ))}
              </div>
            )}

            {activeTab === "contributions" && (
              <div>
                <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Annual Contributions</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={slab}>Monthly savings / investment</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={0} max={5000} step={100} value={inputs.monthlySavings} onChange={e => si("monthlySavings", +e.target.value)} style={{ flex: 1, accentColor }} /><span style={{ fontSize: 13, fontWeight: 700, minWidth: 65, textAlign: "right" }}>{fmt(inputs.monthlySavings)}/mo</span></div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={slab}>Monthly super contributions (total incl. employer)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={0} max={3000} step={50} value={inputs.superContrib} onChange={e => si("superContrib", +e.target.value)} style={{ flex: 1, accentColor }} /><span style={{ fontSize: 13, fontWeight: 700, minWidth: 65, textAlign: "right" }}>{fmt(inputs.superContrib)}/mo</span></div>
                </div>
                <div style={{ height: 1, background: "rgba(240,237,230,0.06)", margin: "16px 0" }} />
                <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>Life Events</div>
                {events.length === 0 && <div style={{ fontSize: 12, color: "rgba(240,237,230,0.3)", marginBottom: 12 }}>No events added yet. Add events like buying property, an inheritance, or a career break.</div>}
                {events.map(ev => (
                  <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(13,27,42,0.5)", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: "#F0EDE6" }}>{EVENT_TYPES.find(t => t.value === ev.type)?.label}</div><div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)" }}>Age {ev.age} · {fmt(pm(ev.amount))}</div></div>
                    <button onClick={() => removeEvent(ev.id)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.3)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                  </div>
                ))}
                {showAddEvent ? (
                  <div style={{ background: "rgba(13,27,42,0.5)", borderRadius: 10, padding: "14px", marginTop: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div><label style={slab}>At age</label><input style={inp} type="number" placeholder="45" value={newEvent.age} onChange={e => setNewEvent(p => ({ ...p, age: e.target.value }))} /></div>
                      <div><label style={slab}>Amount ($)</label><input style={inp} type="text" placeholder="100,000" value={newEvent.amount} onChange={e => setNewEvent(p => ({ ...p, amount: e.target.value }))} /></div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={slab}>Event type</label>
                      <select style={{ ...inp, cursor: "pointer" }} value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}>
                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    {(newEvent.type === "property_buy") && <div style={{ marginBottom: 8 }}><label style={slab}>Mortgage / debt ($)</label><input style={inp} type="text" placeholder="0" value={newEvent.debt} onChange={e => setNewEvent(p => ({ ...p, debt: e.target.value }))} /></div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={addEvent} style={{ flex: 1, padding: "9px", background: accentColor, color: "#0D1B2A", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add event</button>
                      <button onClick={() => setShowAddEvent(false)} style={{ padding: "9px 14px", background: "transparent", color: "rgba(240,237,230,0.4)", border: "1px solid rgba(240,237,230,0.1)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddEvent(true)} style={{ width: "100%", padding: "9px", background: "transparent", color: accentColor, border: `1px dashed ${accentColor}55`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>+ Add life event</button>
                )}
              </div>
            )}

            {activeTab === "assumptions" && (
              <div>
                <div style={{ fontSize: 11, color: accentColor, fontWeight: 700, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Growth Assumptions</div>
                {[{ k: "propGrowth", l: "Property growth rate", min: 0, max: 10, step: 0.5 }, { k: "superReturn", l: "Super fund return", min: 1, max: 12, step: 0.5 }, { k: "investReturn", l: "Investment return", min: 1, max: 15, step: 0.5 }, { k: "inflation", l: "Inflation rate", min: 0, max: 8, step: 0.5 }].map(f => (
                  <div key={f.k} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><label style={{ ...slab, margin: 0 }}>{f.l}</label><span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{inputs[f.k]}%</span></div>
                    <input type="range" min={f.min} max={f.max} step={f.step} value={inputs[f.k]} onChange={e => si(f.k, parseFloat(e.target.value))} style={{ width: "100%", accentColor }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(240,237,230,0.2)", marginTop: 2 }}><span>{f.min}%</span><span>{f.max}%</span></div>
                  </div>
                ))}
                <div style={{ background: "rgba(167,139,212,0.07)", border: "1px solid rgba(167,139,212,0.18)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: accentColor, fontWeight: 700, marginBottom: 4 }}>Defaults based on</div>
                  <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6 }}>Property: CoreLogic 20yr average. Super: APRA balanced fund median. Investments: ASX long-run average. Inflation: RBA target midpoint.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — chart and results */}
        <div>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Current net worth", value: fmt(currentNW), sub: `${currentPct}th percentile`, color: accentColor },
              { label: `At retirement (${inputs.retireAge})`, value: fmt(retireNW), sub: `${retirePct}th percentile`, color: "#5BA08A" },
              { label: "Years to retirement", value: yearsToRetire, sub: `retiring at ${inputs.retireAge}`, color: "#7EB8D4" },
              { label: "Readiness score", value: `${retireScore}/100`, sub: retireScore >= 70 ? "On track" : retireScore >= 40 ? "Needs attention" : "Action needed", color: retireScore >= 70 ? "#5BA08A" : retireScore >= 40 ? "#E8C05A" : "#E8935A" },
            ].map(c => (
              <div key={c.label} style={{ background: "#142133", border: `1px solid ${c.color}22`, borderRadius: 12, padding: "14px 12px" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(240,237,230,0.32)", marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.color, marginBottom: 2 }}>{c.value}</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Retirement readiness bar */}
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F0EDE6" }}>Retirement Readiness</div>
              <div style={{ fontSize: 11, color: retireScore >= 70 ? "#5BA08A" : retireScore >= 40 ? "#E8C05A" : "#E8935A", fontWeight: 700 }}>{retireScore >= 70 ? "On track" : retireScore >= 40 ? "Needs attention" : "Action needed"}</div>
            </div>
            <div style={{ background: "rgba(13,27,42,0.6)", borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ width: `${retireScore}%`, height: "100%", background: retireScore >= 70 ? "#5BA08A" : retireScore >= 40 ? "#E8C05A" : "#E8935A", borderRadius: 6, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(240,237,230,0.28)" }}>
              <span>Action needed</span><span>Needs attention</span><span>On track</span>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "20px 16px 12px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F0EDE6", marginBottom: 2 }}>Net Worth Projection</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)" }}>Age {inputs.age} → {inputs.retireAge}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[{ label: "Confidence band", state: showBands, set: setShowBands }, { label: "Asset streams", state: showBreakdown, set: setShowBreakdown }].map(t => (
                  <button key={t.label} onClick={() => t.set(!t.state)} style={{ padding: "4px 10px", border: `1px solid ${t.state ? accentColor : "rgba(240,237,230,0.12)"}`, background: t.state ? accentColor + "18" : "transparent", color: t.state ? accentColor : "rgba(240,237,230,0.38)", borderRadius: 20, fontSize: 10, fontWeight: t.state ? 700 : 400, cursor: "pointer" }}>{t.label}</button>
                ))}
                <button onClick={() => setShowScenario(!showScenario)} style={{ padding: "4px 10px", border: `1px solid ${showScenario ? "#5BA08A" : "rgba(240,237,230,0.12)"}`, background: showScenario ? "#5BA08A18" : "transparent", color: showScenario ? "#5BA08A" : "rgba(240,237,230,0.38)", borderRadius: 20, fontSize: 10, fontWeight: showScenario ? 700 : 400, cursor: "pointer" }}>Compare scenario</button>
              </div>
            </div>
            <ForecastChart data={data} dataB={showScenario?dataB:[]} showBands={showBands} showBreakdown={showBreakdown} accentColor={accentColor} />
            {showBreakdown && (
              <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                {[{ c: "#5BA08A", l: "Property" }, { c: "#7EB8D4", l: "Super" }, { c: "#E8C05A", l: "Investments" }, { c: accentColor, l: "Net Worth" }].map(i => (
                  <div key={i.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}><div style={{ width: 12, height: 2, background: i.c, borderRadius: 1 }} /><span style={{ color: "rgba(240,237,230,0.45)" }}>{i.l}</span></div>
                ))}
              </div>
            )}
            {showScenario && (
              <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}><div style={{ width: 16, height: 2, background: accentColor, borderRadius: 1 }} /><span style={{ color: "rgba(240,237,230,0.45)" }}>Base scenario</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}><div style={{ width: 16, height: 2, background: "#5BA08A", borderRadius: 1, borderTop: "2px dashed #5BA08A" }} /><span style={{ color: "rgba(240,237,230,0.45)" }}>Scenario B</span><span style={{ color: "#5BA08A", fontWeight: 700, fontSize: 11 }}>{fmt(dataB[dataB.length-1]?.nw||0)}</span></div>
                <span style={{ fontSize: 10, color: "#5BA08A" }}>+{fmt((dataB[dataB.length-1]?.nw||0)-(data[data.length-1]?.nw||0))} difference at retirement</span>
              </div>
            )}
          </div>

          {/* Scenario B controls */}
          {showScenario && (
            <div style={{ background: "#142133", border: "1px solid #5BA08A33", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5BA08A", marginBottom: 14 }}>Scenario B — adjust to compare</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Monthly savings</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={0} max={5000} step={100} value={scenarioB.monthlySavings} onChange={e=>setScenarioB(p=>({...p,monthlySavings:+e.target.value}))} style={{ flex: 1, accentColor: "#5BA08A" }}/><span style={{ fontSize: 12, fontWeight: 700, minWidth: 65, textAlign: "right", color: "#5BA08A" }}>{fmt(scenarioB.monthlySavings)}/mo</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Monthly super</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={0} max={3000} step={50} value={scenarioB.superContrib} onChange={e=>setScenarioB(p=>({...p,superContrib:+e.target.value}))} style={{ flex: 1, accentColor: "#5BA08A" }}/><span style={{ fontSize: 12, fontWeight: 700, minWidth: 65, textAlign: "right", color: "#5BA08A" }}>{fmt(scenarioB.superContrib)}/mo</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.38)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Investment return</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="range" min={1} max={12} step={0.5} value={scenarioB.investReturn} onChange={e=>setScenarioB(p=>({...p,investReturn:+e.target.value}))} style={{ flex: 1, accentColor: "#5BA08A" }}/><span style={{ fontSize: 12, fontWeight: 700, minWidth: 32, textAlign: "right", color: "#5BA08A" }}>{scenarioB.investReturn}%</span></div>
                </div>
                <div style={{ background: "rgba(91,160,138,0.08)", border: "1px solid rgba(91,160,138,0.2)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", marginBottom: 3 }}>Scenario B at retirement</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#5BA08A" }}>{fmt(dataB[dataB.length-1]?.nw||0)}</div>
                  <div style={{ fontSize: 10, color: "#5BA08A" }}>+{fmt((dataB[dataB.length-1]?.nw||0)-(data[data.length-1]?.nw||0))} vs base</div>
                </div>
              </div>
            </div>
          )}
          {/* Percentile trajectory */}
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F0EDE6", marginBottom: 14 }}>Percentile Trajectory</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data.filter((d, i) => i === 0 || i === Math.floor(data.length / 3) || i === Math.floor(data.length * 2 / 3) || i === data.length - 1).map((d, i) => (
                <div key={i} style={{ flex: 1, minWidth: 80, background: "rgba(13,27,42,0.5)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginBottom: 3 }}>Age {d.age}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{d.pct}<span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}>th</span></div>
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginTop: 2 }}>{fmt(d.nw)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Life events on timeline */}
          {events.length > 0 && (
            <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F0EDE6", marginBottom: 12 }}>Life Events on Timeline</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {events.map(ev => (
                  <div key={ev.id} style={{ background: accentColor + "18", border: `1px solid ${accentColor}33`, borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, color: accentColor, fontWeight: 700 }}>{EVENT_TYPES.find(t => t.value === ev.type)?.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(240,237,230,0.45)" }}>Age {ev.age} · {fmt(pm(ev.amount))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset breakdown at retirement */}
          <div style={{ background: "#142133", border: "1px solid rgba(240,237,230,0.07)", borderRadius: 14, padding: "18px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F0EDE6", marginBottom: 14 }}>Projected Asset Mix at Retirement</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[{ label: "Property", value: retireData.prop || 0, color: "#5BA08A" }, { label: "Super", value: retireData.sup || 0, color: "#7EB8D4" }, { label: "Investments", value: retireData.inv || 0, color: "#E8C05A" }, { label: "Cash", value: retireData.csh || 0, color: "#A8D5B5" }, { label: "Mortgage", value: -(retireData.mort || 0), color: "#E8935A" }, { label: "Other Debt", value: -(retireData.debt || 0), color: "#D4785A" }].map(a => (
                <div key={a.label} style={{ background: "rgba(13,27,42,0.5)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: a.value >= 0 ? a.color : "#E8935A" }}>{a.value < 0 ? "-" : ""}{fmt(Math.abs(a.value))}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: 10, color: "rgba(240,237,230,0.18)", lineHeight: 1.6, textAlign: "center", marginBottom: 32 }}>
            Projections are illustrative only. Based on simplified assumptions and do not account for taxation, fees, or variable returns. Not financial advice.
          </div>

          {/* CTA */}
          <div style={{ background: "linear-gradient(135deg,#1a2e42,#142133)", border: `1px solid ${accentColor}22`, borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>See where you rank right now</div>
            <div style={{ fontSize: 12, color: "rgba(240,237,230,0.4)", marginBottom: 16 }}>The calculator shows your current percentile against other Australians.</div>
            <button onClick={() => setPage("home")} style={{ padding: "12px 24px", background: accentColor, color: "#0D1B2A", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Go to the Calculator</button>
          </div>
        </div>
      </div>
    <PageFooter setPage={setPage}/>
  </div>
  );
}
