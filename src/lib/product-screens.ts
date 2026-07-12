export type ProductCategory = "status" | "calls" | "people" | "profile" | "utility" | "media" | "settings" | "security";
export type ProductVariant = "stories" | "calls" | "people" | "profile" | "generic" | "media" | "settings";
export type ProductScreenDefinition = {
  id: string; route: string; category: ProductCategory; title: string;
  description: string; variant: ProductVariant; icon: string;
};

export const PRODUCT_SCREENS: ProductScreenDefinition[] = [
  {
    "id": "status",
    "route": "/status",
    "category": "status",
    "title": "Status",
    "description": "Share moments with the people you choose.",
    "variant": "stories",
    "icon": "sparkles"
  },
  {
    "id": "status-create",
    "route": "/status/create",
    "category": "status",
    "title": "Create status",
    "description": "Choose text, photo, video or a private audience.",
    "variant": "stories",
    "icon": "plus"
  },
  {
    "id": "status-text",
    "route": "/status/text",
    "category": "status",
    "title": "Text status",
    "description": "Turn a thought into an expressive, animated update.",
    "variant": "stories",
    "icon": "edit"
  },
  {
    "id": "status-photo",
    "route": "/status/photo",
    "category": "status",
    "title": "Photo status",
    "description": "Add a caption, audience and expiry before sharing.",
    "variant": "stories",
    "icon": "camera"
  },
  {
    "id": "status-viewers",
    "route": "/status/viewers",
    "category": "status",
    "title": "Status viewers",
    "description": "See who viewed your update without exposing extra activity.",
    "variant": "people",
    "icon": "eye"
  },
  {
    "id": "stories",
    "route": "/stories",
    "category": "status",
    "title": "Stories",
    "description": "A focused view of disappearing moments from your circle.",
    "variant": "stories",
    "icon": "sparkles"
  },
  {
    "id": "stories-create",
    "route": "/stories/create",
    "category": "status",
    "title": "New story",
    "description": "Capture a moment and control exactly who can see it.",
    "variant": "stories",
    "icon": "camera"
  },
  {
    "id": "calls",
    "route": "/calls",
    "category": "calls",
    "title": "Calls",
    "description": "Voice and video conversations in one calm, private space.",
    "variant": "calls",
    "icon": "phone"
  },
  {
    "id": "calls-history",
    "route": "/calls/history",
    "category": "calls",
    "title": "Call history",
    "description": "Review recent incoming, outgoing and missed calls.",
    "variant": "calls",
    "icon": "history"
  },
  {
    "id": "calls-new",
    "route": "/calls/new",
    "category": "calls",
    "title": "Start a call",
    "description": "Find a contact and begin a secure voice or video call.",
    "variant": "people",
    "icon": "phone"
  },
  {
    "id": "calls-voice",
    "route": "/calls/voice",
    "category": "calls",
    "title": "Voice call",
    "description": "A distraction-free call surface with clear privacy states.",
    "variant": "calls",
    "icon": "phone"
  },
  {
    "id": "calls-video",
    "route": "/calls/video",
    "category": "calls",
    "title": "Video call",
    "description": "Premium full-screen video controls built for mobile and desktop.",
    "variant": "calls",
    "icon": "video"
  },
  {
    "id": "contacts",
    "route": "/contacts",
    "category": "people",
    "title": "Contacts",
    "description": "Your trusted people, searchable without exposing phone numbers.",
    "variant": "people",
    "icon": "users"
  },
  {
    "id": "contacts-new",
    "route": "/contacts/new",
    "category": "people",
    "title": "New contact",
    "description": "Add someone by username, QR code or private invite.",
    "variant": "people",
    "icon": "plus"
  },
  {
    "id": "contacts-invite",
    "route": "/contacts/invite",
    "category": "people",
    "title": "Invite friends",
    "description": "Share a safe invite link without revealing your mobile number.",
    "variant": "people",
    "icon": "send"
  },
  {
    "id": "channels",
    "route": "/channels",
    "category": "people",
    "title": "Channels",
    "description": "Follow focused updates without mixing them into private chats.",
    "variant": "people",
    "icon": "broadcast"
  },
  {
    "id": "channels-new",
    "route": "/channels/new",
    "category": "people",
    "title": "Create channel",
    "description": "Build a public or private broadcast space with clear permissions.",
    "variant": "people",
    "icon": "plus"
  },
  {
    "id": "groups-new",
    "route": "/groups/new",
    "category": "people",
    "title": "Create group",
    "description": "Bring people together with role-based member controls.",
    "variant": "people",
    "icon": "users"
  },
  {
    "id": "profile",
    "route": "/profile",
    "category": "profile",
    "title": "Profile",
    "description": "Your public identity, privacy summary and personal shortcuts.",
    "variant": "profile",
    "icon": "user"
  },
  {
    "id": "profile-edit",
    "route": "/profile/edit",
    "category": "profile",
    "title": "Edit profile",
    "description": "Update your name, bio, avatar and public username.",
    "variant": "settings",
    "icon": "edit"
  },
  {
    "id": "profile-media",
    "route": "/profile/media",
    "category": "profile",
    "title": "Profile media",
    "description": "Manage avatars, cover visuals and shared identity assets.",
    "variant": "media",
    "icon": "image"
  },
  {
    "id": "qr",
    "route": "/qr",
    "category": "profile",
    "title": "My QR code",
    "description": "Let people connect without sharing your phone number.",
    "variant": "profile",
    "icon": "qr"
  },
  {
    "id": "invite",
    "route": "/invite",
    "category": "profile",
    "title": "Invite link",
    "description": "Create a revocable link for private connections.",
    "variant": "profile",
    "icon": "link"
  },
  {
    "id": "search",
    "route": "/search",
    "category": "utility",
    "title": "Search",
    "description": "Find chats, people, messages and files from one command surface.",
    "variant": "generic",
    "icon": "search"
  },
  {
    "id": "saved",
    "route": "/saved",
    "category": "utility",
    "title": "Saved messages",
    "description": "Your private space for notes, links, files and reminders.",
    "variant": "generic",
    "icon": "bookmark"
  },
  {
    "id": "archive",
    "route": "/archive",
    "category": "utility",
    "title": "Archived chats",
    "description": "Keep quiet conversations out of sight without deleting them.",
    "variant": "generic",
    "icon": "archive"
  },
  {
    "id": "notifications",
    "route": "/notifications",
    "category": "utility",
    "title": "Notifications",
    "description": "A focused inbox for mentions, calls and security events.",
    "variant": "generic",
    "icon": "bell"
  },
  {
    "id": "camera",
    "route": "/camera",
    "category": "media",
    "title": "Camera",
    "description": "A Snapchat-inspired capture experience with privacy-first sharing.",
    "variant": "media",
    "icon": "camera"
  },
  {
    "id": "media",
    "route": "/media",
    "category": "media",
    "title": "Shared media",
    "description": "Browse photos, videos, files and links across conversations.",
    "variant": "media",
    "icon": "grid"
  },
  {
    "id": "media-photos",
    "route": "/media/photos",
    "category": "media",
    "title": "Photos",
    "description": "A clean gallery of images shared in your conversations.",
    "variant": "media",
    "icon": "image"
  },
  {
    "id": "media-videos",
    "route": "/media/videos",
    "category": "media",
    "title": "Videos",
    "description": "Find and replay shared videos without digging through chats.",
    "variant": "media",
    "icon": "video"
  },
  {
    "id": "media-files",
    "route": "/media/files",
    "category": "media",
    "title": "Files",
    "description": "Documents and downloads organized by conversation and date.",
    "variant": "media",
    "icon": "file"
  },
  {
    "id": "media-links",
    "route": "/media/links",
    "category": "media",
    "title": "Links",
    "description": "A searchable library of websites shared in your chats.",
    "variant": "media",
    "icon": "link"
  },
  {
    "id": "settings",
    "route": "/settings",
    "category": "settings",
    "title": "Settings",
    "description": "Control privacy, appearance, notifications, devices and data.",
    "variant": "settings",
    "icon": "settings"
  },
  {
    "id": "settings-account",
    "route": "/settings/account",
    "category": "settings",
    "title": "Account",
    "description": "Manage your identity, username and account lifecycle.",
    "variant": "settings",
    "icon": "user"
  },
  {
    "id": "settings-profile",
    "route": "/settings/profile",
    "category": "settings",
    "title": "Profile settings",
    "description": "Choose what people see when they open your profile.",
    "variant": "settings",
    "icon": "edit"
  },
  {
    "id": "settings-location",
    "route": "/settings/location",
    "category": "settings",
    "title": "Location access",
    "description": "Control when IPChat can use your location and how precise it may be.",
    "variant": "settings",
    "icon": "globe"
  },
  {
    "id": "settings-privacy",
    "route": "/settings/privacy",
    "category": "settings",
    "title": "Privacy",
    "description": "Control visibility, read receipts, calls and message requests.",
    "variant": "settings",
    "icon": "shield"
  },
  {
    "id": "settings-sessions",
    "route": "/settings/sessions",
    "category": "settings",
    "title": "Login sessions",
    "description": "Inspect active devices, session location and revoke access.",
    "variant": "settings",
    "icon": "devices"
  },
  {
    "id": "settings-security",
    "route": "/settings/security",
    "category": "settings",
    "title": "Security",
    "description": "Review sessions, two-step verification and recovery controls.",
    "variant": "settings",
    "icon": "lock"
  },
  {
    "id": "settings-devices",
    "route": "/settings/devices",
    "category": "settings",
    "title": "Devices",
    "description": "See active sessions and remove devices you no longer trust.",
    "variant": "settings",
    "icon": "devices"
  },
  {
    "id": "settings-notifications",
    "route": "/settings/notifications",
    "category": "settings",
    "title": "Notifications",
    "description": "Tune message, group, call and security alerts.",
    "variant": "settings",
    "icon": "bell"
  },
  {
    "id": "settings-chats",
    "route": "/settings/chats",
    "category": "settings",
    "title": "Chat settings",
    "description": "Configure message behavior, drafts, media and archive rules.",
    "variant": "settings",
    "icon": "message"
  },
  {
    "id": "settings-appearance",
    "route": "/settings/appearance",
    "category": "settings",
    "title": "Appearance",
    "description": "Switch themes, text size, motion and interface density.",
    "variant": "settings",
    "icon": "palette"
  },
  {
    "id": "settings-themes",
    "route": "/settings/themes",
    "category": "settings",
    "title": "Themes",
    "description": "Choose a visual personality for your IPChat experience.",
    "variant": "settings",
    "icon": "sparkles"
  },
  {
    "id": "settings-wallpapers",
    "route": "/settings/wallpapers",
    "category": "settings",
    "title": "Chat wallpapers",
    "description": "Set global or per-chat backgrounds with live previews.",
    "variant": "settings",
    "icon": "image"
  },
  {
    "id": "settings-storage",
    "route": "/settings/storage",
    "category": "settings",
    "title": "Storage",
    "description": "Understand local cache usage and safely clear large media.",
    "variant": "settings",
    "icon": "storage"
  },
  {
    "id": "settings-data",
    "route": "/settings/data",
    "category": "settings",
    "title": "Data usage",
    "description": "Control downloads, upload quality and network behavior.",
    "variant": "settings",
    "icon": "chart"
  },
  {
    "id": "settings-language",
    "route": "/settings/language",
    "category": "settings",
    "title": "Language",
    "description": "Choose the language and regional formatting for IPChat.",
    "variant": "settings",
    "icon": "globe"
  },
  {
    "id": "settings-accessibility",
    "route": "/settings/accessibility",
    "category": "settings",
    "title": "Accessibility",
    "description": "Adjust contrast, motion, text size and touch comfort.",
    "variant": "settings",
    "icon": "accessibility"
  },
  {
    "id": "settings-blocked",
    "route": "/settings/blocked",
    "category": "settings",
    "title": "Blocked users",
    "description": "Review and manage people who cannot contact you.",
    "variant": "settings",
    "icon": "block"
  },
  {
    "id": "settings-help",
    "route": "/settings/help",
    "category": "settings",
    "title": "Help & support",
    "description": "Find answers, report a problem and contact support.",
    "variant": "settings",
    "icon": "help"
  },
  {
    "id": "settings-about",
    "route": "/settings/about",
    "category": "settings",
    "title": "About IPChat",
    "description": "Version, policies, acknowledgements and service status.",
    "variant": "settings",
    "icon": "info"
  },
  {
    "id": "settings-delete-account",
    "route": "/settings/delete-account",
    "category": "settings",
    "title": "Delete account",
    "description": "Review consequences and securely close your account.",
    "variant": "settings",
    "icon": "trash"
  },
  {
    "id": "devices",
    "route": "/devices",
    "category": "security",
    "title": "Trusted devices",
    "description": "Manage every active browser and session from one place.",
    "variant": "settings",
    "icon": "devices"
  }
] as ProductScreenDefinition[];
export const PRODUCT_SCREEN_MAP = new Map(PRODUCT_SCREENS.map((screen) => [screen.id, screen]));

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  status: "MOMENTS", calls: "CALLS", people: "PEOPLE", profile: "IDENTITY",
  utility: "YOUR SPACE", media: "MEDIA", settings: "PREFERENCES", security: "SECURITY"
};

export const CATEGORY_FEATURES: Record<ProductCategory, Array<{ title: string; copy: string; icon: string }>> = {
  status: [
    { title: "Audience first", copy: "Choose exactly who can view each moment.", icon: "eye" },
    { title: "Disappears naturally", copy: "Keep updates temporary and intentional.", icon: "sparkles" },
    { title: "Private replies", copy: "Responses return to one-to-one chat.", icon: "message" }
  ],
  calls: [
    { title: "Clear controls", copy: "Mute, speaker, camera and privacy state at a glance.", icon: "phone" },
    { title: "Device aware", copy: "Move confidently between mobile and desktop.", icon: "devices" },
    { title: "History you control", copy: "Review and clean up call records anytime.", icon: "history" }
  ],
  people: [
    { title: "Username discovery", copy: "Connect without exposing phone numbers.", icon: "users" },
    { title: "Clear permissions", copy: "Roles and member controls stay understandable.", icon: "shield" },
    { title: "Fast search", copy: "Find the right person or space instantly.", icon: "search" }
  ],
  profile: [
    { title: "Public identity", copy: "Show only the details you intentionally choose.", icon: "user" },
    { title: "Private number", copy: "Your mobile number stays hidden from other users.", icon: "lock" },
    { title: "Revocable access", copy: "QR codes and invite links remain under your control.", icon: "link" }
  ],
  utility: [
    { title: "One search surface", copy: "People, chats, files and links in one place.", icon: "search" },
    { title: "Private workspace", copy: "Keep saved content separate from conversations.", icon: "bookmark" },
    { title: "Calm by default", copy: "Archive and notification tools reduce noise.", icon: "archive" }
  ],
  media: [
    { title: "Visual browsing", copy: "Large previews and clear grouping by type.", icon: "grid" },
    { title: "View-once aware", copy: "Disappearing content keeps its privacy state.", icon: "eye" },
    { title: "Storage clarity", copy: "Know what is cached and where space is used.", icon: "storage" }
  ],
  settings: [
    { title: "Instant navigation", copy: "Every preference opens as a real page.", icon: "settings" },
    { title: "Human language", copy: "Privacy choices explain their effect before saving.", icon: "help" },
    { title: "Device consistency", copy: "Preferences stay understandable across screens.", icon: "devices" }
  ],
  security: [
    { title: "Session visibility", copy: "Know exactly where your account is signed in.", icon: "devices" },
    { title: "Layered protection", copy: "OTP, recovery and verification work together.", icon: "lock" },
    { title: "Audited safety", copy: "Sensitive administrative access remains accountable.", icon: "shield" }
  ]
};

export function getProductScreen(id: string): ProductScreenDefinition {
  const screen = PRODUCT_SCREEN_MAP.get(id);
  if (!screen) throw new Error(`Unknown product screen: ${id}`);
  return screen;
}

export function getRelatedScreens(screen: ProductScreenDefinition, limit = 7) {
  return PRODUCT_SCREENS.filter((item) => item.category === screen.category && item.id !== screen.id).slice(0, limit);
}
