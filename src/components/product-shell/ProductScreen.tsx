import type { CSSProperties } from "react";
import Link from "next/link";
import { CATEGORY_FEATURES, CATEGORY_LABELS, getProductScreen, getRelatedScreens } from "@/lib/product-screens";
import { ProductShell } from "./ProductShell";
import { Icon } from "./Icon";
import styles from "./product-screen.module.css";

const STORY_NAMES=["Your story","Aarav","Meera","Riya","Dev","Nisha"];
const CALLS=[
{name:"Meera Shah",type:"Incoming video",time:"12:42",tone:"violet"},
{name:"Aarav Patel",type:"Outgoing voice",time:"Yesterday",tone:"blue"},
{name:"Team North",type:"Missed group call",time:"Mon",tone:"pink"},
{name:"Nisha Rao",type:"Incoming voice",time:"Sun",tone:"green"}
];
const PEOPLE=["Aarav Patel","Meera Shah","Nisha Rao","Dev Mehta","Riya Kapoor","Team North"];
function initials(name:string){return name.split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase()}

export function ProductScreen({screenId}:{screenId:string}){
  const screen=getProductScreen(screenId);
  const related=getRelatedScreens(screen);
  const features=CATEGORY_FEATURES[screen.category];
  return <ProductShell title={screen.title}><div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroGlow}/>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{CATEGORY_LABELS[screen.category]}</span>
        <h1>{screen.title}</h1><p>{screen.description}</p>
        <div className={styles.heroActions}>
          <Link href="/chat" className={styles.primaryAction}><Icon name="message" size={17}/>Open chats</Link>
          {screen.route!=="/settings"&&screen.category==="settings"&&<Link href="/settings" className={styles.secondaryAction}>All settings<Icon name="arrow" size={14}/></Link>}
        </div>
      </div>
      <div className={styles.heroIcon}><span><Icon name={screen.icon} size={35} strokeWidth={1.55}/></span><i/><i/><i/></div>
    </section>

    <section className={styles.featureGrid}>
      {features.map((feature,index)=><article key={feature.title} style={{"--delay":`${index*70}ms`} as CSSProperties}>
        <span className={styles.featureIcon}><Icon name={feature.icon} size={18}/></span>
        <strong>{feature.title}</strong><p>{feature.copy}</p>
      </article>)}
    </section>

    {screen.variant==="stories"&&<StoryPreview/>}
    {screen.variant==="calls"&&<CallPreview/>}
    {screen.variant==="people"&&<PeoplePreview/>}
    {screen.variant==="media"&&<MediaPreview/>}
    {screen.variant==="settings"&&<SettingsPreview related={related}/>}
    {(screen.variant==="generic"||screen.variant==="profile")&&<BentoPreview screenId={screen.id}/>}

    {screen.variant!=="settings"&&related.length>0&&<section className={styles.relatedSection}>
      <div className={styles.sectionHeading}><div><span>EXPLORE</span><h2>Related pages</h2></div><small>Every item opens as its own route.</small></div>
      <div className={styles.relatedGrid}>{related.map(item=><Link key={item.id} href={item.route}>
        <span><Icon name={item.icon} size={18}/></span><div><strong>{item.title}</strong><small>{item.description}</small></div><Icon name="arrow" size={14}/>
      </Link>)}</div>
    </section>}
  </div></ProductShell>
}

function StoryPreview(){return <section className={styles.previewCard}>
  <div className={styles.sectionHeading}><div><span>LIVE PREVIEW</span><h2>Moments from your circle</h2></div><Link href="/status/create">Create status <Icon name="plus" size={14}/></Link></div>
  <div className={styles.storyRail}>{STORY_NAMES.map((name,index)=><Link href={index===0?"/status/create":"/status"} key={name}>
    <span className={`${styles.storyRing} ${index===0?styles.myStory:""}`}><i>{index===0?"+":initials(name)}</i></span><small>{name}</small>
  </Link>)}</div>
  <div className={styles.statusList}>{["A quiet evening in Ahmedabad","New project milestone","Morning ride"].map((text,index)=><article key={text}>
    <span className={styles.statusAvatar}>{["MS","AP","NR"][index]}</span><div><strong>{["Meera Shah","Aarav Patel","Nisha Rao"][index]}</strong><small>{text}</small></div><time>{["2m","24m","1h"][index]}</time>
  </article>)}</div>
</section>}

function CallPreview(){return <section className={styles.previewCard}>
  <div className={styles.sectionHeading}><div><span>RECENT</span><h2>Calls</h2></div><Link href="/calls/new">New call <Icon name="phone" size={14}/></Link></div>
  <div className={styles.callList}>{CALLS.map(call=><article key={call.name}>
    <span className={`${styles.callAvatar} ${styles[call.tone]}`}>{initials(call.name)}</span>
    <div><strong>{call.name}</strong><small><Icon name={call.type.includes("video")?"video":"phone"} size={12}/>{call.type}</small></div>
    <time>{call.time}</time><Link href={call.type.includes("video")?"/calls/video":"/calls/voice"}><Icon name={call.type.includes("video")?"video":"phone"} size={17}/></Link>
  </article>)}</div>
</section>}

function PeoplePreview(){return <section className={styles.previewCard}>
  <div className={styles.sectionHeading}><div><span>TRUSTED PEOPLE</span><h2>Connections</h2></div><Link href="/contacts/new">Add contact <Icon name="plus" size={14}/></Link></div>
  <div className={styles.peopleGrid}>{PEOPLE.map((name,index)=><Link key={name} href="/chat">
    <span className={`${styles.personAvatar} ${styles[["blue","violet","pink","green"][index%4]]}`}>{initials(name)}</span><strong>{name}</strong><small>@{name.toLowerCase().replace(/\s+/g,"_")}</small><i><Icon name="message" size={15}/></i>
  </Link>)}</div>
</section>}

function MediaPreview(){return <section className={styles.previewCard}>
  <div className={styles.sectionHeading}><div><span>LIBRARY</span><h2>Shared content</h2></div><Link href="/media">View all <Icon name="arrow" size={14}/></Link></div>
  <div className={styles.mediaGrid}>{Array.from({length:8}).map((_,index)=><Link key={index} href={index%3===0?"/media/videos":"/media/photos"} className={styles[`media${index%4+1}`]}>
    <span><Icon name={index%3===0?"video":"image"} size={22}/></span><small>{index%3===0?"Video":"Photo"} · {index+2}d</small>
  </Link>)}</div>
</section>}

function SettingsPreview({related}:{related:ReturnType<typeof getRelatedScreens>}){return <section className={styles.previewCard}>
  <div className={styles.sectionHeading}><div><span>CONTROL CENTER</span><h2>Preferences</h2></div><small>Clear, separate pages for every setting.</small></div>
  <div className={styles.settingsList}>{related.map((item,index)=><Link key={item.id} href={item.route}>
    <span className={`${styles.settingIcon} ${styles[["blue","violet","green","pink"][index%4]]}`}><Icon name={item.icon} size={18}/></span>
    <div><strong>{item.title}</strong><small>{item.description}</small></div><Icon name="arrow" size={15}/>
  </Link>)}</div>
</section>}

function BentoPreview({screenId}:{screenId:string}){
  const items=[
    {title:screenId.includes("search")?"Search everything":"Designed for focus",copy:"Clear hierarchy, calm motion and fast navigation.",icon:"search"},
    {title:"Private by default",copy:"Identity and sensitive settings stay understandable.",icon:"shield"},
    {title:"Responsive everywhere",copy:"Desktop, tablet and mobile layouts share one system.",icon:"devices"},
    {title:"Motion with purpose",copy:"Spring transitions guide attention without adding noise.",icon:"sparkles"}
  ];
  return <section className={styles.bento}>{items.map((item,index)=><article key={item.title} className={index===0?styles.bentoLarge:""}>
    <span><Icon name={item.icon} size={21}/></span><strong>{item.title}</strong><p>{item.copy}</p>
  </article>)}</section>
}
