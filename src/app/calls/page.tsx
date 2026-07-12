"use client";
import { useMemo, useState } from "react";
import { ProductShell } from "@/components/product-shell/ProductShell";
import { Icon } from "@/components/product-shell/Icon";
import { haptic } from "@/lib/haptics";
import styles from "./calls.module.css";

type Tab="history"|"dial"|"recordings";
const history=[
 {name:"Meera Shah",type:"Video",dir:"Incoming",when:"12:42",duration:"18:24",tone:"violet"},
 {name:"Aarav Patel",type:"Voice",dir:"Outgoing",when:"Yesterday",duration:"06:11",tone:"blue"},
 {name:"Nisha Rao",type:"Voice",dir:"Missed",when:"Monday",duration:"—",tone:"pink"},
 {name:"Team North",type:"Group",dir:"Incoming",when:"Sunday",duration:"42:08",tone:"green"}
];
const keys=[["1",""],["2","ABC"],["3","DEF"],["4","GHI"],["5","JKL"],["6","MNO"],["7","PQRS"],["8","TUV"],["9","WXYZ"],["*",""],["0","+"],["#",""]];
const initials=(n:string)=>n.split(" ").map(x=>x[0]).join("").slice(0,2);
export default function CallsPage(){
 const[tab,setTab]=useState<Tab>("history"),[number,setNumber]=useState(""),[calling,setCalling]=useState(false),[consent,setConsent]=useState(false);
 const stats=useMemo(()=>({total:history.length,missed:history.filter(x=>x.dir==="Missed").length}),[]);
 const pick=(t:Tab)=>{haptic();setTab(t)};
 return <ProductShell title="Calls"><div className={styles.page}>
  <section className={styles.hero}><div><small>CALL CENTER</small><h1>Everything calls.<br/>One screen.</h1><p>History, dial pad, consent-first recordings and premium statistics without separate pages.</p></div><div className={styles.orb}><Icon name="phone" size={36}/><i/><i/></div></section>
  <section className={styles.stats}><article><small>TOTAL</small><strong>{stats.total}</strong><span>Last 7 days</span></article><article><small>TALK TIME</small><strong>66m</strong><span>Connected</span></article><article><small>MISSED</small><strong>{stats.missed}</strong><span>Needs attention</span></article><article><small>QUALITY</small><strong>98%</strong><span>Network score</span></article></section>
  <section className={styles.panel}><div className={styles.tabs}><button className={tab==="history"?styles.active:""} onClick={()=>pick("history")}><Icon name="history" size={16}/>History</button><button className={tab==="dial"?styles.active:""} onClick={()=>pick("dial")}><Icon name="phone" size={16}/>Dial pad</button><button className={tab==="recordings"?styles.active:""} onClick={()=>pick("recordings")}><Icon name="file" size={16}/>Recordings</button></div>
  {tab==="history"&&<div className={styles.list}>{history.map(x=><article key={x.name}><span className={styles[x.tone]}>{initials(x.name)}</span><div><strong>{x.name}</strong><small><Icon name={x.type==="Video"?"video":"phone"} size={12}/>{x.dir} · {x.type}</small></div><time><strong>{x.when}</strong><small>{x.duration}</small></time><button onClick={()=>{haptic("medium");setCalling(true)}}><Icon name={x.type==="Video"?"video":"phone"} size={17}/></button></article>)}</div>}
  {tab==="dial"&&<div className={styles.dialGrid}><div className={styles.dial}><div className={styles.number}><small>PRIVATE IN-APP CALL</small><strong>{number||"Enter number"}</strong>{number&&<button onClick={()=>{haptic("light");setNumber(x=>x.slice(0,-1))}}>⌫</button>}</div><div className={styles.keys}>{keys.map(([k,l])=><button key={k} onClick={()=>{haptic("light");setNumber(x=>(x+k).slice(0,20))}}><strong>{k}</strong><small>{l}</small></button>)}</div><button className={styles.call} disabled={!number} onClick={()=>{haptic("success");setCalling(true)}}><Icon name="phone"/>Call</button></div><aside><Icon name="shield" size={25}/><small>RECORDING SAFETY</small><h2>Never record silently.</h2><p>Recording becomes available only after an in-app call connects and every participant receives a clear consent notice.</p><label><input type="checkbox" checked={consent} onChange={e=>{haptic();setConsent(e.target.checked)}}/><i/><span><strong>Ask to record after connection</strong><small>Consent is required</small></span></label></aside></div>}
  {tab==="recordings"&&<div className={styles.recordings}><div className={styles.notice}><Icon name="shield"/><span><strong>Consent-protected recordings</strong><small>Only completed in-app recordings appear here.</small></span></div>{[["Project planning","Meera + 2","12:48"],["Product feedback","Aarav Patel","05:16"]].map(x=><article key={x[0]}><button onClick={()=>haptic("light")}>▶</button><div><strong>{x[0]}</strong><small>{x[1]} · 08 Jul</small></div><time>{x[2]}</time><b>CONSENT ✓</b></article>)}</div>}</section>
  {calling&&<div className={styles.overlay}><div className={styles.modal}><span><Icon name="phone" size={28}/></span><small>IN-APP CALL</small><h2>{number||"Connecting…"}</h2><p>WebRTC calling will activate in the call-backend phase. No fake completed call is created.</p>{consent&&<em>Recording request will appear after connection</em>}<button onClick={()=>{haptic("warning");setCalling(false)}}><Icon name="phone"/>End</button></div></div>}
 </div></ProductShell>
}
