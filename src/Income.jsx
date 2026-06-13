import { useState, useEffect, useRef } from "react";

// ATO Individual Tax Statistics 2021-22
// Income percentile thresholds by age group (AUD, before tax)
const ATO_ALL = {
  label: "All Australian earners",
  percentiles: { 10:14000,20:24000,30:35000,40:48000,50:62400,60:78000,70:95000,80:118000,90:155000,95:200000,99:350000 },
  median: 62400
};
const ATO_AGE = {
  "18-24": { label:"Ages 18–24", percentiles:{10:6000,20:12000,30:18000,40:24000,50:30000,60:38000,70:48000,80:62000,90:82000,95:105000,99:165000}, median:30000 },
  "25-34": { label:"Ages 25–34", percentiles:{10:18000,20:32000,30:46000,40:60000,50:74000,60:90000,70:108000,80:130000,90:165000,95:210000,99:360000}, median:74000 },
  "35-44": { label:"Ages 35–44", percentiles:{10:18000,20:32000,30:48000,40:64000,50:80000,60:98000,70:118000,80:145000,90:190000,95:245000,99:420000}, median:80000 },
  "45-54": { label:"Ages 45–54", percentiles:{10:16000,20:30000,30:46000,40:62000,50:78000,60:96000,70:116000,80:142000,90:185000,95:240000,99:410000}, median:78000 },
  "55-64": { label:"Ages 55–64", percentiles:{10:12000,20:24000,30:38000,40:54000,50:68000,60:84000,70:102000,80:126000,90:165000,95:215000,99:380000}, median:68000 },
  "65+":   { label:"Ages 65+",   percentiles:{10:8000,20:18000,30:28000,40:38000,50:48000,60:60000,70:74000,80:92000,90:125000,95:165000,99:310000}, median:48000 },
};
const ATO_STATE = {
  "NSW": { label:"New South Wales", median:68000, top10:168000 },
  "VIC": { label:"Victoria",        median:65000, top10:160000 },
  "QLD": { label:"Queensland",      median:62000, top10:155000 },
  "WA":  { label:"Western Australia",median:70000, top10:175000 },
  "SA":  { label:"South Australia",  median:59000, top10:148000 },
  "TAS": { label:"Tasmania",         median:56000, top10:140000 },
  "ACT": { label:"ACT",              median:82000, top10:195000 },
  "NT":  { label:"Northern Territory",median:72000, top10:180000 },
};

const LABELS = [
  {min:0,max:25,label:"Entry level",color:"#6B8CAE"},
  {min:25,max:50,label:"Middle income",color:"#5BA08A"},
  {min:50,max:75,label:"Above average",color:"#E8935A"},
  {min:75,max:90,label:"High income",color:"#E8C05A"},
  {min:90,max:100,label:"Top earner",color:"#C9A84C"},
];

function getAgeGroup(age) {
  const a = parseInt(age);
  if (a<=24) return "18-24"; if (a<=34) return "25-34"; if (a<=44) return "35-44";
  if (a<=54) return "45-54"; if (a<=64) return "55-64"; return "65+";
}

function calcPct(income, dataset) {
  const p = dataset.percentiles, k = [10,20,30,40,50,60,70,80,90,95,99];
  if (income <= 0) return 2;
  if (income < p[10]) return Math.round((income/p[10])*10);
  for (let i=0; i<k.length-1; i++) {
    const lo=k[i], hi=k[i+1];
    if (income>=p[lo] && income<p[hi]) return Math.round(lo+((income-p[lo])/(p[hi]-p[lo]))*(hi-lo));
  }
  return Math.round(99+Math.min((income-p[99])/p[99],1)*0.9);
}

function getLabel(pct) { return LABELS.find(l=>pct>=l.min&&pct<l.max)||LABELS[LABELS.length-1]; }
function fmt(n) { if(n>=1000000)return"$"+(n/1000000).toFixed(1)+"M"; if(n>=1000)return"$"+Math.round(n/1000)+"K"; return"$"+n.toLocaleString("en-AU"); }
function fmtFull(n) { return "$"+Math.round(n).toLocaleString("en-AU"); }

function Bell({pct, color="#E8935A", animated}) {
  const ref=useRef(null), ar=useRef(null);
  const [dp,setDp]=useState(0);
  useEffect(()=>{
    if(!animated){setDp(pct);return;}
    let s=null; const ease=t=>t<0.5?2*t*t:-1+(4-2*t)*t;
    const run=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1200,1);setDp(Math.round(ease(p)*pct));if(p<1)ar.current=requestAnimationFrame(run);};
    ar.current=requestAnimationFrame(run); return()=>cancelAnimationFrame(ar.current);
  },[pct,animated]);
  useEffect(()=>{
    const c=ref.current; if(!c)return;
    const ctx=c.getContext("2d"),W=c.width,H=c.height;
    ctx.clearRect(0,0,W,H);
    const mu=0.5,si=0.18,g=x=>Math.exp(-0.5*((x-mu)/si)**2),my=g(mu),n=300;
    const mX=(dp/100)*(W-60)+30;
    ctx.beginPath();
    for(let i=0;i<=n;i++){const x=(i/n)*(W-60)+30,t=i/n,y=H-30-(g(t)/my)*(H-60);if(i===0)ctx.moveTo(x,H-30);ctx.lineTo(x,y);if(x>=mX)break;}
    ctx.lineTo(mX,H-30);ctx.closePath();
    const gr=ctx.createLinearGradient(30,0,mX,0);gr.addColorStop(0,color+"26");gr.addColorStop(1,color+"80");ctx.fillStyle=gr;ctx.fill();
    ctx.beginPath();for(let i=0;i<=n;i++){const x=(i/n)*(W-60)+30,t=i/n,y=H-30-(g(t)/my)*(H-60);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.strokeStyle="rgba(240,237,230,0.2)";ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(30,H-30);ctx.lineTo(W-30,H-30);ctx.strokeStyle="rgba(240,237,230,0.12)";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="rgba(240,237,230,0.3)";ctx.font="11px system-ui";ctx.textAlign="center";
    [0,25,50,75,100].forEach(p=>ctx.fillText(p+"%",(p/100)*(W-60)+30,H-10));
    const mT=(mX-30)/(W-60),mY=H-30-(g(mT)/my)*(H-60);
    ctx.beginPath();ctx.moveTo(mX,H-30);ctx.lineTo(mX,mY-10);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(mX,mY-10,6,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    ctx.beginPath();ctx.arc(mX,mY-10,3,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
  },[dp,color]);
  return <canvas ref={ref} width={600} height={180} style={{width:"100%",height:"auto",display:"block"}}/>;
}



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
            <div style={{fontSize:10,color:"rgba(240,237,230,0.18)"}}>Data: ABS 2021–22 · ASFA 2023–24</div>
            <div style={{fontSize:9,background:"rgba(91,160,138,0.12)",color:"#5BA08A",border:"1px solid rgba(91,160,138,0.2)",borderRadius:4,padding:"2px 5px",fontWeight:600}}>v1.4</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Income({ setPage }) {
  const [form, setForm] = useState({ income:"", age:"", state:"", incomeType:"salary", compareMode:"age" });
  const [result, setResult] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));
  const accent = "#5BA08A";

  const calc = () => {
    if (!form.income || !form.age) return;
    const income = parseFloat(String(form.income).replace(/,/g,"")) || 0;
    const ageGrp = getAgeGroup(form.age);
    const ageData = ATO_AGE[ageGrp];
    const allData = ATO_ALL;
    const agePct = calcPct(income, ageData);
    const allPct = calcPct(income, allData);
    const dataset = form.compareMode==="age" ? ageData : allData;
    const pct = form.compareMode==="age" ? agePct : allPct;
    const stateData = form.state ? ATO_STATE[form.state] : null;
    const statePct = stateData ? calcPct(income, { percentiles:{10:stateData.top10*0.4,20:stateData.top10*0.55,30:stateData.top10*0.65,40:stateData.top10*0.77,50:stateData.median,60:stateData.median*1.2,70:stateData.median*1.45,80:stateData.median*1.75,90:stateData.top10,95:stateData.top10*1.3,99:stateData.top10*2.2} }) : null;
    // Weekly / monthly breakdown
    const weekly = Math.round(income/52);
    const monthly = Math.round(income/12);
    // After tax estimate (simplified)
    let tax = 0;
    if (income>180000) tax=51667+(income-180000)*0.45;
    else if (income>120000) tax=29467+(income-120000)*0.37;
    else if (income>45000) tax=5092+(income-45000)*0.325;
    else if (income>18200) tax=(income-18200)*0.19;
    const medicare = income*0.02;
    const afterTax = Math.max(0, income-tax-medicare);
    setResult({ income, ageGrp, agePct, allPct, pct, dataset, ageData, allData, stateData, statePct, weekly, monthly, afterTax });
    setAnimated(false);
    setTimeout(()=>{ setAnimated(true); resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); },100);
  };

  const reCalc = (mode,r) => {
    const dataset = mode==="age"?r.ageData:r.allData;
    const pct = mode==="age"?r.agePct:r.allPct;
    sf("compareMode",mode);
    setResult({...r,pct,dataset});
    setAnimated(false); setTimeout(()=>setAnimated(true),50);
  };

  const share = () => {
    const txt = `I'm in the top ${100-result?.pct}% of Australian earners${form.compareMode==="age"?" my age":""}. Where do you rank? Check wealthrank-au.vercel.app`;
    if(navigator.share) navigator.share({title:"My Income Rank",text:txt});
    else { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(()=>setCopied(false),2500); }
  };

  const li = result ? getLabel(result.pct) : null;
  const inp = {width:"100%",background:"rgba(13,27,42,0.8)",border:"1px solid rgba(240,237,230,0.12)",borderRadius:10,padding:"12px 14px",color:"#F0EDE6",fontSize:15,outline:"none",boxSizing:"border-box"};
  const slab = {display:"block",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,237,230,0.4)",marginBottom:6,fontWeight:600};
  const seg = (active) => ({flex:1,padding:"11px",border:"none",background:active?accent+"22":"transparent",color:active?accent:"rgba(240,237,230,0.45)",fontWeight:active?700:400,cursor:"pointer",fontSize:13,borderBottom:`2px solid ${active?accent:"transparent"}`,transition:"all 0.2s"});
  const tg = (active) => ({flex:1,padding:"10px",border:"none",background:active?accent:"transparent",color:active?"#0D1B2A":"rgba(240,237,230,0.5)",fontWeight:active?700:400,cursor:"pointer",fontSize:12,transition:"all 0.2s"});

  return (
    <>
      <div style={{textAlign:"center",padding:"52px 24px 40px",borderBottom:"1px solid rgba(240,237,230,0.06)"}}>
        <div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:accent,marginBottom:10,fontWeight:600}}>Australian Wealth Index</div>
        <h1 style={{fontSize:"clamp(24px,5vw,48px)",fontWeight:800,lineHeight:1.05,letterSpacing:"-0.02em",margin:"0 0 10px"}}>Income Percentile Calculator</h1>
        <p style={{fontSize:14,color:"rgba(240,237,230,0.45)",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>Find out where your salary ranks against other Australian earners — by age, state, and nationally.</p>
      </div>

      <div style={{maxWidth:580,margin:"0 auto",padding:"32px 24px 0"}}>
        {!result && (
          <div style={{background:"#142133",border:"1px solid rgba(240,237,230,0.08)",borderRadius:16,padding:"26px"}}>
            <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.38)",marginBottom:8,fontWeight:600}}>Income type</div>
            <div style={{display:"flex",background:"rgba(13,27,42,0.8)",border:"1px solid rgba(240,237,230,0.1)",borderRadius:12,overflow:"hidden",marginBottom:20}}>
              <button style={seg(form.incomeType==="salary")} onClick={()=>sf("incomeType","salary")}>Salary / wages</button>
              <button style={seg(form.incomeType==="total")} onClick={()=>sf("incomeType","total")}>Total income</button>
            </div>
            <div style={{marginBottom:16}}>
              <label style={slab}>Annual income ($)</label>
              <input style={inp} type="text" placeholder="e.g. 95,000" value={form.income} onChange={e=>sf("income",e.target.value)}/>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.25)",marginTop:4}}>Before tax, full year equivalent</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div>
                <label style={slab}>Your age</label>
                <input style={inp} type="number" placeholder="34" value={form.age} onChange={e=>sf("age",e.target.value)} min="15" max="80"/>
              </div>
              <div>
                <label style={slab}>State (optional)</label>
                <select style={{...inp,cursor:"pointer"}} value={form.state} onChange={e=>sf("state",e.target.value)}>
                  <option value="">All Australia</option>
                  {Object.entries(ATO_STATE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,237,230,0.38)",marginBottom:8,fontWeight:600}}>Compare against</div>
              <div style={{display:"flex",background:"rgba(13,27,42,0.8)",border:"1px solid rgba(240,237,230,0.1)",borderRadius:10,overflow:"hidden"}}>
                <button style={tg(form.compareMode==="age")} onClick={()=>sf("compareMode","age")}>Australians my age</button>
                <button style={tg(form.compareMode==="all")} onClick={()=>sf("compareMode","all")}>All Australian earners</button>
              </div>
            </div>
            <button style={{width:"100%",padding:"14px",background:accent,color:"#0D1B2A",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"}} onClick={calc}>Calculate My Rank →</button>
          </div>
        )}

        {result && (
          <div ref={resultRef}>
            <div style={{textAlign:"center",padding:"36px 0 22px"}}>
              <div style={{fontSize:10,color:"rgba(240,237,230,0.28)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5}}>Income rank</div>
              <div style={{display:"inline-block",background:li.color+"22",color:li.color,border:`1px solid ${li.color}44`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{li.label}</div>
              <div style={{fontSize:"clamp(56px,12vw,96px)",fontWeight:900,lineHeight:1,letterSpacing:"-0.03em",color:accent}}>{result.pct}<span style={{fontSize:"0.38em",fontWeight:400,opacity:0.55}}>th</span></div>
              <div style={{fontSize:15,color:"rgba(240,237,230,0.6)",marginTop:4,marginBottom:22}}>
                percentile — earning more than <strong style={{color:"#F0EDE6"}}>{result.pct}%</strong> of{" "}
                {form.compareMode==="age" ? `Australian earners aged ${result.ageData.label.toLowerCase()}` : "all Australian earners"}
              </div>
            </div>

            <div style={{background:"#142133",border:"1px solid rgba(240,237,230,0.07)",borderRadius:14,padding:"20px 12px 8px",marginBottom:16}}>
              <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.28)",marginBottom:8,paddingLeft:4}}>
                Income Distribution — {form.compareMode==="age" ? result.ageData.label : "All Australian Earners"}
              </div>
              <Bell pct={result.pct} animated={animated} color={accent}/>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {["age","all"].map(m=>(
                <button key={m} onClick={()=>reCalc(m,result)} style={{flex:1,padding:"8px",border:`1px solid ${form.compareMode===m?accent+"88":"rgba(240,237,230,0.09)"}`,background:form.compareMode===m?accent+"14":"transparent",color:form.compareMode===m?accent:"rgba(240,237,230,0.38)",borderRadius:8,fontSize:12,fontWeight:form.compareMode===m?700:400,cursor:"pointer"}}>
                  {m==="age"?"vs. earners my age":"vs. all Australian earners"}
                </button>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[
                {label:"Annual income",value:fmtFull(result.income),color:"#F0EDE6"},
                {label:"Median for "+( form.compareMode==="age" ? "your age" : "all earners"),value:fmt(result.dataset.median),color:"rgba(240,237,230,0.6)"},
                {label:"Weekly equivalent",value:fmtFull(result.weekly),color:"#5BA08A"},
                {label:"Estimated after-tax (pa)",value:fmt(result.afterTax),color:"#7EB8D4"},
              ].map(s=>(
                <div key={s.label} style={{background:"#142133",border:"1px solid rgba(240,237,230,0.07)",borderRadius:12,padding:"14px"}}>
                  <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.32)",marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>

            {result.stateData && result.statePct !== null && (
              <div style={{background:"#142133",border:"1px solid rgba(240,237,230,0.07)",borderRadius:12,padding:"16px",marginBottom:16}}>
                <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.32)",marginBottom:8}}>State comparison — {result.stateData.label}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:10,color:"rgba(240,237,230,0.35)",marginBottom:3}}>Your rank in {form.state}</div><div style={{fontSize:20,fontWeight:700,color:accent}}>{result.statePct}th percentile</div></div>
                  <div><div style={{fontSize:10,color:"rgba(240,237,230,0.35)",marginBottom:3}}>State median income</div><div style={{fontSize:20,fontWeight:700,color:"rgba(240,237,230,0.6)"}}>{fmt(result.stateData.median)}</div></div>
                </div>
              </div>
            )}

            <div style={{background:"linear-gradient(135deg,#1a2e42,#142133)",border:`1px solid ${accent}35`,borderRadius:12,padding:"18px",marginBottom:16}}>
              <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:accent+"aa",marginBottom:7}}>Income vs net worth</div>
              <div style={{fontSize:13,color:"rgba(240,237,230,0.58)",lineHeight:1.7}}>A high income is only part of the picture. Wealth is built through what you save and invest, not just what you earn. See how your <strong style={{color:"#F0EDE6"}}>net worth</strong> compares against other Australians.</div>
              <button onClick={()=>setPage("home")} style={{marginTop:12,padding:"9px 18px",background:accent,color:"#0D1B2A",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Calculate Net Worth Rank →</button>
            </div>

            <button style={{width:"100%",padding:"12px",background:"transparent",color:accent,border:`2px solid ${accent}`,borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}} onClick={share}>{copied?"✓ Copied!":"Share my result"}</button>
            <button style={{width:"100%",padding:"10px",background:"transparent",color:"rgba(240,237,230,0.3)",border:"1px solid rgba(240,237,230,0.09)",borderRadius:10,fontSize:12,cursor:"pointer"}} onClick={()=>setResult(null)}>← Recalculate</button>
            <div style={{textAlign:"center",fontSize:9,color:"rgba(240,237,230,0.16)",margin:"20px 0 32px",letterSpacing:"0.05em"}}>DATA: ATO TAXATION STATISTICS 2021–22 · FOR INFORMATIONAL USE ONLY · NOT FINANCIAL ADVICE</div>
          </div>
        )}
      </div>
    </div>
    <PageFooter setPage={setPage}/>
  </>
  );
}
