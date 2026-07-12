"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductShell } from "@/components/product-shell/ProductShell";
import { Icon } from "@/components/product-shell/Icon";
import { WorldGlobe } from "@/components/world-globe/WorldGlobe";
import styles from "./location.module.css";

type LocationMode="off"|"approximate"|"precise";
type PermissionValue=PermissionState|"unsupported"|"checking";
type CoordinateState={latitude:number;longitude:number;accuracy:number}|null;

const MODES=[
{id:"off" as const,title:"Off",description:"IPChat will not request or use your device location.",icon:"block"},
{id:"approximate" as const,title:"Approximate",description:"Use a rounded area for timezone and nearby suggestions.",icon:"globe"},
{id:"precise" as const,title:"Precise",description:"Use device accuracy only when a feature explicitly needs it.",icon:"settings"}
];

export function LocationSettings(){
  const[mode,setMode]=useState<LocationMode>("off");
  const[permission,setPermission]=useState<PermissionValue>("checking");
  const[coords,setCoords]=useState<CoordinateState>(null);
  const[requesting,setRequesting]=useState(false);
  const[error,setError]=useState<string|null>(null);

  useEffect(()=>{
    const stored=window.localStorage.getItem("ipchat-location-mode") as LocationMode|null;
    if(stored&&MODES.some(item=>item.id===stored))setMode(stored);
    if(!navigator.permissions?.query){setPermission("unsupported");return}
    let mounted=true;
    void navigator.permissions.query({name:"geolocation" as PermissionName}).then(status=>{
      if(!mounted)return;
      setPermission(status.state);
      status.onchange=()=>setPermission(status.state);
    }).catch(()=>{if(mounted)setPermission("unsupported")});
    return()=>{mounted=false};
  },[]);

  const displayed=useMemo(()=>{
    if(!coords||mode==="off")return null;
    const digits=mode==="precise"?4:2;
    return{latitude:coords.latitude.toFixed(digits),longitude:coords.longitude.toFixed(digits),accuracy:Math.round(coords.accuracy)};
  },[coords,mode]);

  function saveMode(next:LocationMode){
    setMode(next);setError(null);window.localStorage.setItem("ipchat-location-mode",next);
    if(next==="off")setCoords(null);
  }

  function requestLocation(nextMode:Exclude<LocationMode,"off">){
    setError(null);setRequesting(true);
    if(!navigator.geolocation){setRequesting(false);setError("Geolocation is not supported in this browser.");return}
    navigator.geolocation.getCurrentPosition(position=>{
      setCoords({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy});
      saveMode(nextMode);setPermission("granted");setRequesting(false);
    },positionError=>{
      setRequesting(false);
      if(positionError.code===positionError.PERMISSION_DENIED)setPermission("denied");
      setError(positionError.code===positionError.PERMISSION_DENIED
        ?"Location permission was denied. Change it from your browser's site settings."
        :"We could not read your location. Check GPS/network access and try again.");
    },{enableHighAccuracy:nextMode==="precise",timeout:12000,maximumAge:nextMode==="precise"?0:300000});
  }

  return <ProductShell title="Location access"><div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>PRIVACY CONTROL</span>
        <h1>Your location.<br/>Your decision.</h1>
        <p>IPChat asks only when a location-aware feature needs it. Your live coordinates are not shown in chats by default and this page does not save coordinates to local storage.</p>
        <div className={styles.permission}><span className={`${styles.permissionDot} ${styles[String(permission)]}`}/><div><small>Browser permission</small><strong>{permission==="checking"?"Checking…":permission}</strong></div></div>
      </div>
      <div className={styles.globe}><WorldGlobe compact label={mode==="off"?"Location is off":`${mode} access selected`}/></div>
    </section>

    <section className={styles.modeGrid}>{MODES.map(item=>{
      const selected=mode===item.id;
      return <button key={item.id} type="button" className={selected?styles.selected:""} onClick={()=>item.id==="off"?saveMode("off"):requestLocation(item.id)} disabled={requesting}>
        <span className={styles.modeIcon}><Icon name={item.icon} size={19}/></span><div><strong>{item.title}</strong><p>{item.description}</p></div><i>{selected?"✓":""}</i>
      </button>
    })}</section>

    {error&&<div className={styles.error}><Icon name="info" size={17}/>{error}</div>}

    <section className={styles.detailGrid}>
      <article className={styles.currentCard}>
        <div className={styles.cardHeading}><span><Icon name="globe" size={18}/></span><div><small>CURRENT LOCATION STATE</small><h2>{mode==="off"?"Not in use":"Available for approved features"}</h2></div></div>
        {displayed?<div className={styles.coordinates}>
          <div><small>Latitude</small><strong>{displayed.latitude}</strong></div>
          <div><small>Longitude</small><strong>{displayed.longitude}</strong></div>
          <div><small>Accuracy</small><strong>±{displayed.accuracy} m</strong></div>
        </div>:<div className={styles.emptyState}><Icon name="shield" size={22}/><p>No coordinates are currently held in this screen.</p></div>}
      </article>

      <article className={styles.privacyCard}>
        <span className={styles.shield}><Icon name="shield" size={23}/></span><small>LOCATION PRIVACY</small><h2>Clear rules, not hidden tracking.</h2>
        <ul><li><i/>Off stays off until you choose another mode.</li><li><i/>Approximate view rounds displayed coordinates.</li><li><i/>Precise access uses the browser permission prompt.</li><li><i/>Revoking browser permission is done in site settings.</li></ul>
      </article>
    </section>

    <section className={styles.useCases}><div><span>OPTIONAL USES</span><h2>What location can improve</h2></div>
      <div className={styles.useCaseGrid}>
        <article><Icon name="globe"/><strong>Timezone</strong><small>Better timestamps while travelling.</small></article>
        <article><Icon name="users"/><strong>Nearby discovery</strong><small>Only after you explicitly enable it.</small></article>
        <article><Icon name="shield"/><strong>Security context</strong><small>Flag unusual sign-in regions without public sharing.</small></article>
      </div>
    </section>
  </div></ProductShell>
}
