"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/haptics";
import { Icon } from "./Icon";
import styles from "./product-shell.module.css";

const NAV = [
  ["/chat","Chats","message"], ["/calls","Calls","phone"],
  ["/status","Status","sparkles"], ["/settings","Settings","settings"]
] as const;

export function ProductShell({ children, title }: { children: React.ReactNode; title: string }) {
  const path = usePathname();
  const [light,setLight] = useState(false);
  useEffect(() => {
    const next = localStorage.getItem("ipchat-theme") === "light";
    setLight(next); document.documentElement.dataset.ipTheme = next ? "light" : "dark";
  }, []);
  function toggleTheme(){ haptic("light"); const next=!light; setLight(next); localStorage.setItem("ipchat-theme",next?"light":"dark"); document.documentElement.dataset.ipTheme=next?"light":"dark"; }
  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/chat" onClick={()=>haptic()}><span>IP</span><div><strong>IPChat</strong><small>Private messenger</small></div></Link>
      <nav>{NAV.map(([href,label,icon])=>{const active=path===href||path.startsWith(href+"/");return <Link key={href} href={href} className={active?styles.active:""} onClick={()=>haptic()}><i><Icon name={icon}/></i><strong>{label}</strong><b/></Link>})}</nav>
      <div className={styles.trust}><Icon name="shield"/><span><strong>Private by design</strong><small>Your number stays hidden.</small></span></div>
    </aside>
    <main><header className={styles.topbar}><span className={styles.mobileLogo}>IP</span><div><small>IPCHAT</small><strong>{title}</strong></div><button onClick={toggleTheme}><Icon name={light?"moon":"sun"}/></button></header><div className={styles.content}>{children}</div></main>
    <nav className={styles.mobileNav}>{NAV.map(([href,label,icon])=>{const active=path===href||path.startsWith(href+"/");return <Link key={href} href={href} className={active?styles.active:""} onClick={()=>haptic()}><Icon name={icon}/><small>{label}</small></Link>})}</nav>
  </div>;
}
