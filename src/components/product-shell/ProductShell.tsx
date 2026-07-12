"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PRODUCT_SCREENS } from "@/lib/product-screens";
import { Icon } from "./Icon";
import styles from "./product-shell.module.css";

const PRIMARY_NAV = [
  { href:"/chat", label:"Chats", icon:"message" },
  { href:"/status", label:"Status", icon:"sparkles" },
  { href:"/calls", label:"Calls", icon:"phone" },
  { href:"/contacts", label:"People", icon:"users" },
  { href:"/media", label:"Media", icon:"grid" },
  { href:"/settings", label:"Settings", icon:"settings" }
];

export function ProductShell({children,title}:{children:React.ReactNode;title?:string}) {
  const pathname = usePathname();
  const [searchOpen,setSearchOpen] = useState(false);
  const [query,setQuery] = useState("");
  const [light,setLight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ipchat-theme");
    const nextLight = stored === "light";
    setLight(nextLight);
    document.documentElement.dataset.ipTheme = nextLight ? "light" : "dark";
  }, []);

  useEffect(() => {
    function onKey(event:KeyboardEvent){
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setSearchOpen(v=>!v)}
      if(event.key==="Escape")setSearchOpen(false);
    }
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]);

  const results = useMemo(() => {
    const value=query.trim().toLowerCase();
    if(!value)return PRODUCT_SCREENS.slice(0,10);
    return PRODUCT_SCREENS.filter(s=>`${s.title} ${s.description}`.toLowerCase().includes(value)).slice(0,12);
  },[query]);

  function toggleTheme(){
    const next=!light;setLight(next);
    window.localStorage.setItem("ipchat-theme",next?"light":"dark");
    document.documentElement.dataset.ipTheme=next?"light":"dark";
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/chat" className={styles.brand}>
          <span className={styles.brandMark}>IP</span>
          <span><strong>IPChat</strong><small>Private messenger</small></span>
        </Link>
        <nav className={styles.nav}>
          {PRIMARY_NAV.map(item=>{
            const active=item.href==="/chat"?pathname==="/chat":pathname===item.href||pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} className={active?styles.active:""}>
              <span className={styles.navIcon}><Icon name={item.icon}/></span><span>{item.label}</span>{active&&<i/>}
            </Link>
          })}
        </nav>
        <div className={styles.sideCard}>
          <span className={styles.sideCardIcon}><Icon name="shield" size={18}/></span>
          <div><strong>Privacy center</strong><small>Review safety and active devices.</small></div>
          <Link href="/settings/privacy"><Icon name="arrow" size={15}/></Link>
        </div>
        <div className={styles.account}>
          <span className={styles.avatar}>YP</span>
          <span><strong>Your account</strong><small>Protected session</small></span>
          <Link href="/profile"><Icon name="arrow" size={16}/></Link>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div><span className={styles.mobileLogo}>IP</span>{title&&<strong>{title}</strong>}</div>
          <div className={styles.topActions}>
            <button className={styles.searchButton} type="button" onClick={()=>setSearchOpen(true)}>
              <Icon name="search" size={18}/><span>Search IPChat</span><kbd>⌘ K</kbd>
            </button>
            <Link href="/settings/sessions" className={styles.locationButton}><span/><Icon name="globe" size={18}/></Link>
            <button className={styles.iconButton} type="button" onClick={toggleTheme}><Icon name={light?"moon":"sun"} size={18}/></button>
            <Link href="/notifications" className={styles.iconButton}><Icon name="bell" size={18}/><i className={styles.notificationDot}/></Link>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>

      <nav className={styles.mobileNav}>
        {PRIMARY_NAV.slice(0,5).map(item=>{
          const active=item.href==="/chat"?pathname==="/chat":pathname===item.href||pathname.startsWith(`${item.href}/`);
          return <Link key={item.href} href={item.href} className={active?styles.active:""}><Icon name={item.icon} size={21}/><small>{item.label}</small></Link>
        })}
      </nav>

      {searchOpen&&<div className={styles.commandBackdrop} onMouseDown={()=>setSearchOpen(false)}>
        <section className={styles.command} role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
          <div className={styles.commandInput}>
            <Icon name="search" size={20}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pages and settings" autoFocus/>
            <button type="button" onClick={()=>setSearchOpen(false)}><Icon name="close" size={17}/></button>
          </div>
          <div className={styles.commandResults}>
            {results.map(screen=><Link key={screen.id} href={screen.route} onClick={()=>setSearchOpen(false)}>
              <span className={styles.resultIcon}><Icon name={screen.icon} size={18}/></span>
              <span><strong>{screen.title}</strong><small>{screen.description}</small></span>
              <Icon name="arrow" size={15}/>
            </Link>)}
          </div>
          <footer><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></footer>
        </section>
      </div>}
    </div>
  );
}
