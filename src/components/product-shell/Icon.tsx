import type { ReactNode } from "react";

type IconProps = { name: string; size?: number; strokeWidth?: number };

const paths: Record<string, ReactNode> = {
  message:<><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5a3.5 3.5 0 0 1-3.5 3.5H11l-4.7 3.6.8-3.9A3.5 3.5 0 0 1 5 11.5Z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/></>,
  sparkles:<><path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/></>,
  phone:<path d="M7.2 3.5 10 7.7 8.3 9.4c1.3 2.7 3.5 4.8 6.2 6.2l1.7-1.7 4.3 2.8-.8 3.1c-.3 1.1-1.4 1.8-2.5 1.6C9.8 20.2 3.8 14.2 2.6 6.8 2.4 5.7 3.1 4.6 4.2 4.3l3-.8Z"/>,
  users:<><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M16.5 14a5 5 0 0 1 4 5"/></>,
  user:<><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.6l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7l-.7-2h-3l-.7 2a7 7 0 0 0-1.6.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.6l-2 .7v3l2 .7a7 7 0 0 0 .7 1.6l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.6.7l.7 2h3l.7-2a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.6l2-.7Z"/></>,
  search:<><circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.4 15.4 4.6 4.6"/></>,
  camera:<><path d="M4 8h3l1.5-2h7L17 8h3v10H4Z"/><circle cx="12" cy="13" r="3.2"/></>,
  video:<><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/></>,
  history:<><path d="M4 6v5h5"/><path d="M5.5 15.5A8 8 0 1 0 5 7"/><path d="M12 7v5l3 2"/></>,
  edit:<><path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z"/><path d="m12.5 6.5 5 5"/></>,
  plus:<path d="M12 5v14M5 12h14"/>,
  eye:<><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.6"/></>,
  send:<path d="m4 4 17 8-17 8 3.2-8L4 4Zm3.2 8H21"/>,
  broadcast:<><path d="M5 8a6 6 0 0 0 0 8M8 10.5a2.5 2.5 0 0 0 0 3"/><circle cx="12" cy="12" r="1.3"/><path d="M16 10.5a2.5 2.5 0 0 1 0 3M19 8a6 6 0 0 1 0 8"/></>,
  qr:<><path d="M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4Z"/><path d="M14 14h2v2h-2ZM18 14h2v6h-6v-2M14 18h2"/></>,
  link:<><path d="M9.5 14.5 14.5 9.5"/><path d="M7.5 16.5 5 19a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 7.5 19 5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/></>,
  bookmark:<path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z"/>,
  archive:<><path d="M4 8h16v12H4Z"/><path d="M3 4h18v4H3ZM9 12h6"/></>,
  bell:<><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7Z"/><path d="M10 20h4"/></>,
  grid:<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  image:<><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></>,
  file:<><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  shield:<path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Zm-3 9 2 2 4-4"/>,
  lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  devices:<><rect x="3" y="4" width="14" height="10" rx="2"/><path d="M8 18h4M10 14v4"/><rect x="16" y="10" width="5" height="10" rx="1.5"/></>,
  palette:<><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 0-10Z"/><circle cx="7.5" cy="9" r=".7"/><circle cx="10" cy="6.5" r=".7"/><circle cx="14" cy="6.5" r=".7"/></>,
  storage:<><ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></>,
  chart:<><path d="M4 20V4M4 20h17"/><path d="m7 16 4-5 3 2 5-7"/></>,
  globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  accessibility:<><circle cx="12" cy="4.5" r="2"/><path d="M5 8h14M12 7v6M8 21l4-8 4 8M7 14h10"/></>,
  block:<><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></>,
  help:<><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 4.4 1.7c-1.3 1.3-2.1 1.5-2.1 3.3M12 17.5h.01"/></>,
  info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></>,
  trash:<><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
  arrow:<path d="m9 5 7 7-7 7"/>,
  sun:<><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon:<path d="M20 15.8A8.5 8.5 0 0 1 8.2 4 8.5 8.5 0 1 0 20 15.8Z"/>,
  close:<path d="m6 6 12 12M18 6 6 18"/>
};

export function Icon({name,size=20,strokeWidth=1.8}:IconProps){
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]??paths.sparkles}</svg>;
}
