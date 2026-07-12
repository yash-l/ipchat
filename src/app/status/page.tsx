"use client";
import { useMemo, useState } from "react";
import { ProductShell } from "@/components/product-shell/ProductShell";
import { Icon } from "@/components/product-shell/Icon";
import { haptic } from "@/lib/haptics";
import styles from "./status.module.css";

type Tab="status"|"snaps"|"mine";
const people=[
 {name:"Meera Shah",time:"2m",caption:"Golden hour ✨",tone:"sunset",views:142},
 {name:"Aarav Patel",time:"18m",caption:"New milestone unlocked",tone:"ocean",views:86},
 {name:"Nisha Rao",time:"42m",caption:"Coffee and calm",tone:"forest",views:64},
 {name:"Dev Mehta",time:"1h",caption:"Night drive",tone:"neon",views:113}
];
const initials=(n:string)=>n.split(" ").map(x=>x[0]).join("").slice(0,2);
export default function StatusPage(){
 const[tab,setTab]=useState<Tab>("status"),[viewer,setViewer]=useState<(typeof people)[number]|null>(null),[creator,setCreator]=useState(false),[draft,setDraft]=useState(""),[posted,setPosted]=useState(false);
 const stats=useMemo(()=>({views:248,replies:19,snaps:12}),[]);
 const open=(p:(typeof people)[number])=>{haptic("medium");setViewer(p)};
 return <ProductShell title="Status"><div className={styles.page}>
  <section className={styles.hero}><div><small>MOMENTS</small><h1>Status and snaps.<br/>One feed.</h1><p>People’s posts, quick snaps, your creator and premium insights are together—not spread across separate pages.</p><button onClick={()=>{haptic("medium");setCreator(true)}}><Icon name="plus"/>Create status</button></div><div className={styles.orbit}><span>YP</span><i>MS</i><i>AP</i><i>NR</i></div></section>
  <section className={styles.stats}><article><small>VIEWS</small><strong>{stats.views}</strong><span>24 hours</span></article><article><small>REPLIES</small><strong>{stats.replies}</strong><span>Private</span></article><article><small>SNAPS</small><strong>{stats.snaps}</strong><span>Your circle</span></article></section>
  <section className={styles.panel}><div className={styles.tabs}><button className={tab==="status"?styles.active:""} onClick={()=>{haptic();setTab("status")}}><Icon name="sparkles"/>Status</button><button className={tab==="snaps"?styles.active:""} onClick={()=>{haptic();setTab("snaps")}}><Icon name="camera"/>Snaps</button><button className={tab==="mine"?styles.active:""} onClick={()=>{haptic();setTab("mine")}}><Icon name="user"/>My status</button></div>
  {tab==="status"&&<><div className={styles.rail}><button onClick={()=>setCreator(true)}><span className={styles.mineRing}>+</span><small>Your status</small></button>{people.map(p=><button key={p.name} onClick={()=>open(p)}><span className={styles.ring}><i className={styles[p.tone]}>{initials(p.name)}</i></span><small>{p.name.split(" ")[0]}</small></button>)}</div><div className={styles.feed}>{people.map(p=><article key={p.name} onClick={()=>open(p)}><div className={`${styles.visual} ${styles[p.tone]}`}><strong>{p.caption}</strong><span><Icon name="eye" size={13}/>{p.views}</span></div><footer><i>{initials(p.name)}</i><div><strong>{p.name}</strong><small>{p.time}</small></div><Icon name="more"/></footer></article>)}</div></>}
  {tab==="snaps"&&<div className={styles.snaps}>{people.map((p,i)=><button key={p.name} className={styles[p.tone]} onClick={()=>open(p)}><Icon name="camera"/><span>{p.name.split(" ")[0]}</span><small>{i===2?"3 snaps":"New snap"}</small></button>)}</div>}
  {tab==="mine"&&<div className={styles.my}><div><strong>{posted?"New status published ✨":"Share a thought or snap"}</strong><small>{posted?"Visible to selected audience":"Nothing active yet"}</small></div><aside><h2>Your insights</h2><section><span><small>Views</small><strong>{posted?31:0}</strong></span><span><small>Replies</small><strong>{posted?4:0}</strong></span><span><small>Completion</small><strong>{posted?"92%":"—"}</strong></span></section><button onClick={()=>setCreator(true)}><Icon name="plus"/>Post new</button></aside></div>}</section>
  {creator&&<div className={styles.overlay} onMouseDown={()=>setCreator(false)}><div className={styles.creator} onMouseDown={e=>e.stopPropagation()}><header><div><small>NEW STATUS</small><h2>Share a moment</h2></div><button onClick={()=>setCreator(false)}>×</button></header><textarea value={draft} onChange={e=>setDraft(e.target.value.slice(0,220))} placeholder="What's happening?" autoFocus/><section><button><Icon name="camera"/>Photo</button><button><Icon name="palette"/>Style</button><button><Icon name="users"/>Audience</button></section><footer><small>{draft.length}/220</small><button disabled={!draft.trim()} onClick={()=>{haptic("success");setPosted(true);setDraft("");setCreator(false)}}><Icon name="send"/>Publish</button></footer></div></div>}
  {viewer&&<div className={styles.viewer} onClick={()=>setViewer(null)}><div className={styles.progress}><i/></div><header><span>{initials(viewer.name)}</span><div><strong>{viewer.name}</strong><small>{viewer.time}</small></div><button>×</button></header><main className={styles[viewer.tone]}><h2>{viewer.caption}</h2></main><footer><input placeholder={`Reply to ${viewer.name.split(" ")[0]}…`}/><button onClick={e=>{e.stopPropagation();haptic("success")}}><Icon name="send"/></button></footer></div>}
 </div></ProductShell>
}
