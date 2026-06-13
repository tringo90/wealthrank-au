import { useState, useEffect, useRef } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────
const AI={all:{label:"All Australians",percentiles:{10:13000,20:55000,30:130000,40:220000,50:350000,60:520000,70:730000,80:1050000,90:1650000,95:2500000,99:5200000},median:350000},"18-24":{label:"Ages 18–24",percentiles:{10:1000,20:5000,30:12000,40:22000,50:35000,60:55000,70:85000,80:130000,90:210000,95:320000,99:650000},median:35000},"25-34":{label:"Ages 25–34",percentiles:{10:5000,20:22000,30:50000,40:90000,50:145000,60:220000,70:330000,80:490000,90:750000,95:1100000,99:2200000},median:145000},"35-44":{label:"Ages 35–44",percentiles:{10:15000,20:65000,30:145000,40:260000,50:420000,60:620000,70:870000,80:1200000,90:1850000,95:2700000,99:5000000},median:420000},"45-54":{label:"Ages 45–54",percentiles:{10:20000,20:90000,30:210000,40:380000,50:620000,60:900000,70:1250000,80:1750000,90:2700000,95:3900000,99:7500000},median:620000},"55-64":{label:"Ages 55–64",percentiles:{10:25000,20:110000,30:270000,40:490000,50:790000,60:1150000,70:1600000,80:2200000,90:3300000,95:4800000,99:9000000},median:790000},"65+":{label:"Ages 65+",percentiles:{10:50000,20:180000,30:380000,40:620000,50:900000,60:1250000,70:1700000,80:2350000,90:3500000,95:5000000,99:9500000},median:900000}};
const AC={all:{label:"All Australian Couples",percentiles:{10:85000,20:220000,30:420000,40:680000,50:1000000,60:1400000,70:1900000,80:2700000,90:4100000,95:6000000,99:11500000},median:1000000},"18-24":{label:"Ages 18–24",percentiles:{10:8000,20:25000,30:60000,40:110000,50:180000,60:280000,70:420000,80:620000,90:950000,95:1400000,99:2800000},median:180000},"25-34":{label:"Ages 25–34",percentiles:{10:20000,20:75000,30:180000,40:330000,50:530000,60:780000,70:1100000,80:1550000,90:2400000,95:3500000,99:6500000},median:530000},"35-44":{label:"Ages 35–44",percentiles:{10:50000,20:200000,30:450000,40:780000,50:1200000,60:1700000,70:2300000,80:3100000,90:4800000,95:7000000,99:13000000},median:1200000},"45-54":{label:"Ages 45–54",percentiles:{10:70000,20:270000,30:600000,40:1050000,50:1650000,60:2300000,70:3100000,80:4300000,90:6500000,95:9500000,99:18000000},median:1650000},"55-64":{label:"Ages 55–64",percentiles:{10:90000,20:350000,30:800000,40:1400000,50:2100000,60:2900000,70:3900000,80:5400000,90:8000000,95:11500000,99:21000000},median:2100000},"65+":{label:"Ages 65+",percentiles:{10:150000,20:500000,30:1000000,40:1650000,50:2400000,60:3300000,70:4400000,80:6000000,90:9000000,95:13000000,99:24000000},median:2400000}};
const AF=[{key:"property",label:"Property",hint:"Home + investment properties"},{key:"super",label:"Super",hint:"Combined balance"},{key:"shares",label:"Shares/ETFs",hint:"ASX, funds, crypto"},{key:"cash",label:"Cash",hint:"Bank, term deposits"},{key:"vehicle",label:"Vehicles",hint:"Cars, boats"},{key:"other_a",label:"Other Assets",hint:"Business, collectibles"}];
const LF=[{key:"mortgage",label:"Mortgage",hint:"Outstanding balance"},{key:"hecs",label:"HECS",hint:"Study debt"},{key:"carloan",label:"Car Loan",hint:"Finance balance"},{key:"creditcard",label:"Credit Cards",hint:"Outstanding"},{key:"personal",label:"Personal Loans",hint:"Unsecured"},{key:"other_l",label:"Other",hint:"Tax debt, BNPL"}];
const LBLS=[{min:0,max:25,label:"Starting Out",color:"#6B8CAE"},{min:25,max:50,label:"Building",color:"#5BA08A"},{min:50,max:75,label:"Established",color:"#E8935A"},{min:75,max:90,label:"Thriving",color:"#E8C05A"},{min:90,max:100,label:"Wealth Leader",color:"#C9A84C"}];

function getAg(a){const n=parseInt(a);if(n<=24)return"18-24";if(n<=34)return"25-34";if(n<=44)return"35-44";if(n<=54)return"45-54";if(n<=64)return"55-64";return"65+";}
function calcPct(nw,ds){const p=ds.percentiles,k=[10,20,30,40,50,60,70,80,90,95,99];if(nw<=0)return 5;if(nw<p[10])return Math.round((nw/p[10])*10);for(let i=0;i<k.length-1;i++){const lo=k[i],hi=k[i+1];if(nw>=p[lo]&&nw<p[hi])return Math.round(lo+((nw-p[lo])/(p[hi]-p[lo]))*(hi-lo));}return Math.round(99+Math.min((nw-p[99])/p[99],1)*0.9);}
function getLabel(p){return LBLS.find(l=>p>=l.min&&p<l.max)||LBLS[LBLS.length-1];}
function pm(s){return parseFloat(String(s).replace(/,/g,""))||0;}
function nextMs(nw,ds){const p=ds.percentiles,k=[10,20,30,40,50,60,70,80,90,95,99];for(const x of k)if(nw<p[x])return{p:x,amt:p[x],gap:p[x]-nw};return null;}
function fmt(n){if(n>=1000000)return"$"+(n/1000000).toFixed(1)+"M";if(n>=1000)return"$"+Math.round(n/1000)+"K";return"$"+n.toLocaleString("en-AU");}

// ── Bell Curve ────────────────────────────────────────────────────────────────
function Bell({percentile,animated,color="#E8935A"}){
  const ref=useRef(null),ar=useRef(null);
  const [dp,setDp]=useState(0);
  useEffect(()=>{
    if(!animated){setDp(percentile);return;}
    let s=null;const ease=t=>t<0.5?2*t*t:-1+(4-2*t)*t;
    const run=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1200,1);setDp(Math.round(ease(p)*percentile));if(p<1)ar.current=requestAnimationFrame(run);};
    ar.current=requestAnimationFrame(run);return()=>cancelAnimationFrame(ar.current);
  },[percentile,animated]);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
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
    ctx.beginPath();ctx.moveTo(30,H-30);ctx.lineTo(W-30,H-30);ctx.strokeStyle="rgba(240,237,230,0.1)";ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle="rgba(240,237,230,0.28)";ctx.font="11px system-ui";ctx.textAlign="center";
    [0,25,50,75,100].forEach(p=>ctx.fillText(p+"%",(p/100)*(W-60)+30,H-10));
    const mT=(mX-30)/(W-60),mY=H-30-(g(mT)/my)*(H-60);
    // Marker line
    ctx.beginPath();ctx.moveTo(mX,H-30);ctx.lineTo(mX,mY-14);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
    // YOU pin
    const pinW=32,pinH=18,pinX=mX-pinW/2,pinY=mY-14-pinH-4;
    // YOU pin background — manually draw rounded rect for browser compatibility
    ctx.beginPath();
    const r=4;
    ctx.moveTo(pinX+r,pinY);
    ctx.lineTo(pinX+pinW-r,pinY);ctx.arcTo(pinX+pinW,pinY,pinX+pinW,pinY+r,r);
    ctx.lineTo(pinX+pinW,pinY+pinH-r);ctx.arcTo(pinX+pinW,pinY+pinH,pinX+pinW-r,pinY+pinH,r);
    ctx.lineTo(pinX+r,pinY+pinH);ctx.arcTo(pinX,pinY+pinH,pinX,pinY+pinH-r,r);
    ctx.lineTo(pinX,pinY+r);ctx.arcTo(pinX,pinY,pinX+r,pinY,r);
    ctx.closePath();
    ctx.fillStyle=color;ctx.fill();
    ctx.fillStyle="#0D1B2A";ctx.font="bold 9px system-ui";ctx.textAlign="center";
    ctx.fillText("YOU",mX,pinY+12);
    // Dot
    ctx.beginPath();ctx.arc(mX,mY-14,5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    ctx.beginPath();ctx.arc(mX,mY-14,2.5,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
  },[dp,color]);
  return <canvas ref={ref} width={700} height={200} style={{width:"100%",height:"auto",display:"block"}}/>;
}

// ── Asset Breakdown Bar ───────────────────────────────────────────────────────
function AssetBar({assets,liabilities}){
  const aItems=[{key:"property",label:"Property",color:"#5BA08A"},{key:"super",label:"Super",color:"#7EB8D4"},{key:"shares",label:"Shares",color:"#E8C05A"},{key:"cash",label:"Cash",color:"#A8D5B5"},{key:"vehicle",label:"Vehicles",color:"#8B9BAF"},{key:"other_a",label:"Other",color:"#6B7A8D"}];
  const lItems=[{key:"mortgage",label:"Mortgage",color:"#E8935A"},{key:"hecs",label:"HECS",color:"#D4785A"},{key:"carloan",label:"Car Loan",color:"#C4634A"},{key:"creditcard",label:"Credit Cards",color:"#B44E3A"},{key:"personal",label:"Personal",color:"#A43A2A"},{key:"other_l",label:"Other",color:"#943020"}];
  const totA=aItems.reduce((s,i)=>s+(assets[i.key]||0),0)||1;
  const totL=lItems.reduce((s,i)=>s+(liabilities[i.key]||0),0)||1;
  const hasA=aItems.some(i=>assets[i.key]>0),hasL=lItems.some(i=>liabilities[i.key]>0);
  if(!hasA&&!hasL)return null;
  return(
    <div style={{background:"#0f1e2d",border:"1px solid rgba(240,237,230,0.07)",borderRadius:16,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.3)",marginBottom:14}}>Asset & Liability Breakdown</div>
      {hasA&&<div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginBottom:6}}>Assets</div>
        <div style={{display:"flex",height:22,borderRadius:5,overflow:"hidden",gap:1}}>
          {aItems.filter(i=>assets[i.key]>0).map(i=><div key={i.key} style={{flex:assets[i.key]/totA,background:i.color,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(0,0,0,0.5)",fontWeight:700,overflow:"hidden",padding:"0 2px"}} title={`${i.label}: ${fmt(assets[i.key])}`}>{assets[i.key]/totA>0.12?i.label:""}</div>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:8}}>
          {aItems.filter(i=>assets[i.key]>0).map(i=><div key={i.key} style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}><div style={{width:6,height:6,borderRadius:2,background:i.color}}/><span style={{color:"rgba(240,237,230,0.4)"}}>{i.label}</span><span style={{color:"#F0EDE6",fontWeight:600}}>{fmt(assets[i.key])}</span></div>)}
        </div>
      </div>}
      {hasL&&<div>
        <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",marginBottom:6}}>Liabilities</div>
        <div style={{display:"flex",height:22,borderRadius:5,overflow:"hidden",gap:1}}>
          {lItems.filter(i=>liabilities[i.key]>0).map(i=><div key={i.key} style={{flex:liabilities[i.key]/totL,background:i.color,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.6)",fontWeight:700,overflow:"hidden",padding:"0 2px"}} title={`${i.label}: ${fmt(liabilities[i.key])}`}>{liabilities[i.key]/totL>0.12?i.label:""}</div>)}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:8}}>
          {lItems.filter(i=>liabilities[i.key]>0).map(i=><div key={i.key} style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}><div style={{width:6,height:6,borderRadius:2,background:i.color}}/><span style={{color:"rgba(240,237,230,0.4)"}}>{i.label}</span><span style={{color:"#F0EDE6",fontWeight:600}}>{fmt(liabilities[i.key])}</span></div>)}
        </div>
      </div>}
    </div>
  );
}

// ── What-If Simulator ─────────────────────────────────────────────────────────
function WhatIf({nw,accent}){
  const [mo,setMo]=useState(500);const [rate,setRate]=useState(7);
  const proj=y=>{const r=rate/100,c=mo*12;return nw*Math.pow(1+r,y)+(r>0?c*((Math.pow(1+r,y)-1)/r):c*y);};
  const mx=Math.max(proj(10),proj(20),proj(30));
  return(
    <div style={{background:"#0f1e2d",border:"1px solid rgba(240,237,230,0.07)",borderRadius:16,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.3)",marginBottom:4}}>What-If Simulator</div>
      <div style={{fontSize:12,color:"rgba(240,237,230,0.35)",marginBottom:14}}>See how your wealth could grow</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div>
          <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Monthly investment</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min={0} max={5000} step={100} value={mo} onChange={e=>setMo(+e.target.value)} style={{flex:1,accentColor:accent}}/><span style={{fontSize:12,fontWeight:700,minWidth:55,textAlign:"right",color:accent}}>{fmt(mo)}/mo</span></div>
        </div>
        <div>
          <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Annual growth</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min={1} max={12} step={0.5} value={rate} onChange={e=>setRate(+e.target.value)} style={{flex:1,accentColor:accent}}/><span style={{fontSize:12,fontWeight:700,minWidth:30,textAlign:"right",color:accent}}>{rate}%</span></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[10,20,30].map(y=>{const v=proj(y),h=Math.round((v/mx)*64);return(
          <div key={y} style={{background:"rgba(13,27,42,0.6)",borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
            <div style={{height:64,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:5}}><div style={{width:28,background:accent,borderRadius:"3px 3px 0 0",height:h,opacity:0.85,transition:"height 0.4s"}}/></div>
            <div style={{fontSize:9,color:"rgba(240,237,230,0.3)",marginBottom:2}}>{y} years</div>
            <div style={{fontSize:13,fontWeight:700}}>{fmt(v)}</div>
            <div style={{fontSize:10,color:"#5BA08A"}}>+{fmt(v-nw)}</div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ── Main Calculator Page ──────────────────────────────────────────────────────

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

export default function Calculator({ setPage }) {
  const [ht,setHt]=useState("individual");
  const [mode,setMode]=useState("quick");
  const [form,setForm]=useState({age:"",assets:"",liabilities:"",cmp:"age"});
  const [pa,setPa]=useState("");
  const [da,setDa]=useState({});const [dl,setDl]=useState({});
  const [res,setRes]=useState(null);
  const [anim,setAnim]=useState(false);
  const [copied,setCopied]=useState(false);
  const resultRef=useRef(null);
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));
  const DATA=ht==="couple"?AC:AI;
  const ea=ht==="couple"?Math.max(parseInt(form.age)||0,parseInt(pa)||0):parseInt(form.age)||0;
  const ic=ht==="couple",acc=ic?"#7EB8D4":"#E8935A",sub=ic?"couple":"individual";

  const tots=()=>{
    if(mode==="deep"){
      const a=AF.reduce((s,f)=>s+pm(da[f.key]||"0"),0);
      const l=LF.reduce((s,f)=>s+pm(dl[f.key]||"0"),0);
      return{a,l};
    }
    return{a:pm(form.assets),l:pm(form.liabilities)};
  };

  const calc=()=>{
    if(!form.age)return;if(ic&&!pa)return;
    const{a,l}=tots(),nw=a-l,g=getAg(ea);
    const ad=DATA[g],all=DATA["all"];
    const apct=calcPct(nw,ad),alp=calcPct(nw,all);
    const ds=form.cmp==="age"?ad:all,pct=form.cmp==="age"?apct:alp;
    const pda=mode==="deep"?Object.fromEntries(AF.map(f=>[f.key,pm(da[f.key]||"0")])):{}; 
    const pdl=mode==="deep"?Object.fromEntries(LF.map(f=>[f.key,pm(dl[f.key]||"0")])):{}; 
    setRes({nw,a,l,g,apct,alp,pct,ms:nextMs(nw,ds),ad,all,ds,ht,pda,pdl,mode});
    setAnim(false);
    setTimeout(()=>{setAnim(true);resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"});},100);
  };

  const rcm=(m,r)=>{
    const ds=m==="age"?r.ad:r.all,pct=m==="age"?r.apct:r.alp;
    sf("cmp",m);setRes({...r,pct,ds,ms:nextMs(r.nw,ds)});
    setAnim(false);setTimeout(()=>setAnim(true),50);
  };

  const share=()=>{
    const p=res?.pct,nw=res?.nw;
    const params=new URLSearchParams({p,nw,ht:res?.ht,cmp:form.cmp,ag:getAg(ea)});
    const url=window.location.origin+window.location.pathname+"?result="+btoa(params.toString());
    const txt=`I'm in the top ${100-p}% of Australian ${ic?"couples":"individuals"} by net worth. Where do you rank? ${url}`;
    if(navigator.share)navigator.share({title:"My Wealth Rank",text:txt,url});
    else{navigator.clipboard.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2500);}
  };

  const li=res?getLabel(res.pct):null;
  const inp={width:"100%",background:"rgba(13,27,42,0.6)",border:"1px solid rgba(240,237,230,0.1)",borderRadius:8,padding:"11px 14px",color:"#F0EDE6",fontSize:14,outline:"none",boxSizing:"border-box"};
  const slab={display:"block",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,237,230,0.38)",marginBottom:5,fontWeight:600};
  const seg=(active,c="#E8935A")=>({flex:1,padding:"10px",border:"none",background:active?c+"18":"transparent",color:active?c:"rgba(240,237,230,0.4)",fontWeight:active?700:400,cursor:"pointer",fontSize:13,borderBottom:`2px solid ${active?c:"transparent"}`,transition:"all 0.15s"});
  const tg=(active)=>({flex:1,padding:"10px",border:"none",background:active?acc:"transparent",color:active?"#0D1B2A":"rgba(240,237,230,0.45)",fontWeight:active?700:400,cursor:"pointer",fontSize:12,transition:"all 0.15s"});

  return (
    <div style={{paddingBottom:0}}>

      {/* Page hero */}
      <div style={{borderBottom:"1px solid rgba(240,237,230,0.06)",padding:"44px 24px 36px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{background:"rgba(232,147,90,0.12)",border:"1px solid rgba(232,147,90,0.25)",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#E8935A"}}>ABS 2021–22 DATA</div>
            <div style={{background:"rgba(91,160,138,0.1)",border:"1px solid rgba(91,160,138,0.22)",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#5BA08A"}}>FREE</div>
            <div style={{background:"rgba(240,237,230,0.06)",border:"1px solid rgba(240,237,230,0.12)",borderRadius:6,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.4)"}}>NO SIGN-UP</div>
          </div>
          <h1 style={{fontSize:"clamp(28px,5vw,52px)",fontWeight:900,lineHeight:1.05,letterSpacing:"-0.025em",margin:"0 0 12px",color:"#F0EDE6"}}>
            Your Financial Position
          </h1>
          <p style={{fontSize:15,color:"rgba(240,237,230,0.5)",maxWidth:560,margin:0,lineHeight:1.7}}>
            Based on current Australian Bureau of Statistics wealth distribution data, see exactly where your household net worth sits relative to other Australians.
          </p>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"36px 24px 0"}}>
        {!res ? (
          <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:32,alignItems:"start"}}>

            {/* Left — input panel */}
            <div style={{position:"sticky",top:72}}>
              <div style={{background:"#142133",border:"1px solid rgba(240,237,230,0.07)",borderRadius:16,padding:"24px"}}>
                {/* Household type */}
                <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.35)",marginBottom:8,fontWeight:600}}>Calculating for</div>
                <div style={{display:"flex",background:"rgba(13,27,42,0.7)",border:"1px solid rgba(240,237,230,0.08)",borderRadius:10,overflow:"hidden",marginBottom:20}}>
                  <button style={seg(ht==="individual","#E8935A")} onClick={()=>{setHt("individual");setPa("");}}>Individual</button>
                  <button style={seg(ht==="couple","#7EB8D4")} onClick={()=>setHt("couple")}>Couple</button>
                </div>
                {/* Detail level */}
                <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.35)",marginBottom:8,fontWeight:600}}>Detail level</div>
                <div style={{display:"flex",background:"rgba(13,27,42,0.7)",border:"1px solid rgba(240,237,230,0.08)",borderRadius:10,overflow:"hidden",marginBottom:20}}>
                  <button style={seg(mode==="quick",acc)} onClick={()=>setMode("quick")}>Quick snapshot</button>
                  <button style={seg(mode==="deep",acc)} onClick={()=>setMode("deep")}>Deep dive</button>
                </div>
                {/* Age */}
                {ic?(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    <div><label style={slab}>Your Age</label><input style={inp} type="number" placeholder="34" value={form.age} onChange={e=>sf("age",e.target.value)}/></div>
                    <div><label style={slab}>Partner's Age</label><input style={inp} type="number" placeholder="32" value={pa} onChange={e=>setPa(e.target.value)}/></div>
                  </div>
                ):(
                  <div style={{marginBottom:14}}><label style={slab}>Your Age</label><input style={inp} type="number" placeholder="34" value={form.age} onChange={e=>sf("age",e.target.value)}/></div>
                )}
                {/* Divider */}
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0 14px",color:"rgba(240,237,230,0.14)",fontSize:10}}>
                  <div style={{flex:1,height:1,background:"rgba(240,237,230,0.07)"}}/><span>{ic?"combined ":""}{mode==="deep"?"itemised ":""}net worth</span><div style={{flex:1,height:1,background:"rgba(240,237,230,0.07)"}}/>
                </div>
                {/* Inputs */}
                {mode==="quick"?(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    <div><label style={slab}>Total Assets ($)</label><input style={inp} type="text" placeholder="650,000" value={form.assets} onChange={e=>sf("assets",e.target.value)}/><div style={{fontSize:9,color:"rgba(240,237,230,0.2)",marginTop:3}}>Property, super, savings</div></div>
                    <div><label style={slab}>Total Liabilities ($)</label><input style={inp} type="text" placeholder="320,000" value={form.liabilities} onChange={e=>sf("liabilities",e.target.value)}/><div style={{fontSize:9,color:"rgba(240,237,230,0.2)",marginTop:3}}>Mortgage, HECS, loans</div></div>
                  </div>
                ):(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.28)",marginBottom:8}}>Assets</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
                      {AF.map(f=><div key={f.key}><label style={slab}>{f.label}</label><input style={{...inp,padding:"8px 10px",fontSize:12}} type="text" placeholder="0" value={da[f.key]||""} onChange={e=>setDa(p=>({...p,[f.key]:e.target.value}))}/></div>)}
                    </div>
                    <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.28)",marginBottom:8}}>Liabilities</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                      {LF.map(f=><div key={f.key}><label style={slab}>{f.label}</label><input style={{...inp,padding:"8px 10px",fontSize:12}} type="text" placeholder="0" value={dl[f.key]||""} onChange={e=>setDl(p=>({...p,[f.key]:e.target.value}))}/></div>)}
                    </div>
                  </div>
                )}
                {/* Compare toggle */}
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,237,230,0.35)",marginBottom:7,fontWeight:600}}>Compare against</div>
                  <div style={{display:"flex",background:"rgba(13,27,42,0.7)",border:"1px solid rgba(240,237,230,0.08)",borderRadius:8,overflow:"hidden"}}>
                    <button style={tg(form.cmp==="age")} onClick={()=>sf("cmp","age")}>{ic?"Couples our age":"Australians my age"}</button>
                    <button style={tg(form.cmp==="all")} onClick={()=>sf("cmp","all")}>All Australian {ic?"couples":"individuals"}</button>
                  </div>
                </div>
                <button style={{width:"100%",padding:"13px",background:acc,color:"#0D1B2A",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:"0.01em"}} onClick={calc}>
                  Calculate {ic?"Our":"My"} Rank →
                </button>
              </div>

              {/* Quick stats below input */}
              <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Median AU net worth",v:"$350K"},{l:"Data source",v:"ABS 2021–22"}].map(s=>(
                  <div key={s.l} style={{background:"#142133",border:"1px solid rgba(240,237,230,0.06)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"rgba(240,237,230,0.3)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{s.l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#F0EDE6"}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — empty state */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,textAlign:"center",padding:"48px 24px"}}>
              <div style={{width:80,height:80,background:"rgba(232,147,90,0.06)",border:"2px dashed rgba(232,147,90,0.2)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
                <div style={{fontSize:28,opacity:0.4}}>%</div>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"rgba(240,237,230,0.5)",marginBottom:8}}>Your result will appear here</div>
              <div style={{fontSize:13,color:"rgba(240,237,230,0.3)",lineHeight:1.6,maxWidth:280}}>Enter your age, assets, and liabilities on the left to see where you rank against other Australians.</div>
            </div>
          </div>
        ) : (
          // ── Results ──────────────────────────────────────────────────────────
          <div ref={resultRef}>
            {/* Back button */}
            <button onClick={()=>setRes(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"rgba(240,237,230,0.4)",cursor:"pointer",fontSize:13,marginBottom:24,padding:0}}>
              ← Recalculate with different numbers
            </button>

            {/* Result hero */}
            <div style={{textAlign:"center",marginBottom:32}}>
              <div style={{display:"inline-block",background:li.color+"18",color:li.color,border:`1px solid ${li.color}33`,borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>{li.label}</div>
              <h2 style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:700,color:"rgba(240,237,230,0.6)",margin:"0 0 4px",letterSpacing:"-0.01em"}}>Your Financial Position</h2>
              <div style={{fontSize:"clamp(72px,14vw,120px)",fontWeight:900,lineHeight:1,letterSpacing:"-0.04em",color:acc,margin:"0 0 8px"}}>
                {res.pct}<span style={{fontSize:"0.3em",fontWeight:400,opacity:0.5,verticalAlign:"super"}}>th</span>
              </div>
              <div style={{fontSize:16,color:"rgba(240,237,230,0.55)"}}>
                Percentile — your net worth is higher than <strong style={{color:"#F0EDE6"}}>{res.pct}%</strong> of{" "}
                {form.cmp==="age"?`Australian ${sub}s aged ${res.ad.label.toLowerCase()}`:`all Australian ${sub}s`}
              </div>
            </div>

            {/* Bell curve card */}
            <div style={{background:"#142133",border:"1px solid rgba(240,237,230,0.07)",borderRadius:16,padding:"24px 16px 12px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"0 4px"}}>
                <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.3)"}}>
                  Percentile Ranking — {form.cmp==="age"?res.ad.label:`All Australian ${sub}s`}
                </div>
                <div style={{display:"flex",gap:6}}>
                  {["age","all"].map(m=>(
                    <button key={m} onClick={()=>rcm(m,res)} style={{padding:"4px 10px",border:`1px solid ${form.cmp===m?acc+"77":"rgba(240,237,230,0.1)"}`,background:form.cmp===m?acc+"14":"transparent",color:form.cmp===m?acc:"rgba(240,237,230,0.35)",borderRadius:20,fontSize:10,fontWeight:form.cmp===m?700:400,cursor:"pointer"}}>
                      {m==="age"?"My age group":"All Australians"}
                    </button>
                  ))}
                </div>
              </div>
              <Bell percentile={res.pct} animated={anim} color={acc}/>
            </div>

            {/* Stat cards — Stitch style: icon + label + value */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[
                {icon:"◈",label:"Your Net Worth",value:`${res.nw<0?"-":""}${fmt(Math.abs(res.nw))}`,color:"#F0EDE6"},
                {icon:"◎",label:"Median Benchmark",value:fmt(res.ds.median),color:"rgba(240,237,230,0.55)"},
                {icon:"▲",label:"Total Assets",value:fmt(res.a),color:"#5BA08A"},
                {icon:"▽",label:"Total Liabilities",value:fmt(res.l),color:"#E8935A"},
              ].map(s=>(
                <div key={s.label} style={{background:"#142133",border:"1px solid rgba(240,237,230,0.06)",borderRadius:12,padding:"16px"}}>
                  <div style={{fontSize:14,color:"rgba(240,237,230,0.2)",marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,237,230,0.35)",marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:"clamp(16px,2.5vw,22px)",fontWeight:700,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Deep dive breakdown */}
            {res.mode==="deep"&&<AssetBar assets={res.pda} liabilities={res.pdl}/>}

            {/* Milestone + Share — side by side like Stitch design */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,marginBottom:16,alignItems:"stretch"}}>
              {res.ms&&(
                <div style={{background:"linear-gradient(135deg,#1a2e42,#142133)",border:`1px solid ${acc}30`,borderRadius:14,padding:"20px"}}>
                  <div style={{fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,237,230,0.3)",marginBottom:4}}>Path to advanced</div>
                  <div style={{fontSize:17,fontWeight:800,marginBottom:4,color:"#F0EDE6"}}>Next Milestone: {res.ms.p}th Percentile</div>
                  <div style={{fontSize:13,color:"rgba(240,237,230,0.5)",lineHeight:1.6}}>
                    Requires a total net worth of <strong style={{color:"#F0EDE6"}}>{fmt(res.ms.amt)}</strong>
                  </div>
                  <div style={{marginTop:10,display:"flex",alignItems:"baseline",gap:8}}>
                    <div style={{fontSize:22,fontWeight:900,color:acc}}>+{fmt(res.ms.gap)}</div>
                    <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",textTransform:"uppercase",letterSpacing:"0.07em"}}>gap to target</div>
                  </div>
                </div>
              )}
              <button onClick={share} style={{background:"#F0EDE6",border:"none",borderRadius:14,padding:"20px 24px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,minWidth:140}}>
                <div style={{fontSize:20}}>↗</div>
                <div style={{fontSize:13,fontWeight:700,color:"#0D1B2A"}}>{copied?"Copied!":"Share my rank"}</div>
              </button>
            </div>

            {/* What-if simulator */}
            <WhatIf nw={res.nw} accent={acc}/>

            {/* Deep dive insights cards — like Stitch design */}
            <div style={{marginBottom:32}}>
              <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(240,237,230,0.28)",marginBottom:14,textAlign:"center"}}>Deep Dive Insights</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={()=>setPage("gen")} style={{background:"linear-gradient(135deg,#1a2e42,#0f1e2d)",border:"1px solid rgba(240,237,230,0.07)",borderRadius:14,padding:"20px",textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F0EDE6",marginBottom:4}}>How you compare by age</div>
                  <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",lineHeight:1.5,marginBottom:10}}>See how wealth varies across generations</div>
                  <div style={{fontSize:10,color:"#7EB8D4",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Explore cohorts →</div>
                </button>
                <button onClick={()=>setPage("forecast")} style={{background:"linear-gradient(135deg,#1a2442,#0f1e2d)",border:"1px solid rgba(240,237,230,0.07)",borderRadius:14,padding:"20px",textAlign:"left",cursor:"pointer"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F0EDE6",marginBottom:4}}>The wealth forecaster</div>
                  <div style={{fontSize:11,color:"rgba(240,237,230,0.4)",lineHeight:1.5,marginBottom:10}}>Project your net worth to retirement</div>
                  <div style={{fontSize:10,color:"#A78BD4",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Simulate growth →</div>
                </button>
              </div>
            </div>

            <div style={{textAlign:"center",fontSize:9,color:"rgba(240,237,230,0.15)",marginBottom:32,letterSpacing:"0.05em"}}>
              DATA: ABS HOUSEHOLD INCOME AND WEALTH, AUSTRALIA 2021–22 · FOR INFORMATIONAL USE ONLY · NOT FINANCIAL ADVICE
            </div>
          </div>
        )}
      </div>
    </div>
    <PageFooter setPage={setPage}/>
  );
}
