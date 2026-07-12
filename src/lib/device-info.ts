export type DeviceInfo = {
  browser: string;
  os: string;
  deviceType: string;
  deviceLabel: string;
};

export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent || "Unknown";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/CriOS|Chrome\//i.test(ua)) browser = "Google Chrome";
  else if (/FxiOS|Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([\d.]+)/i);
    os = match?.[1] ? `Android ${match[1]}` : "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS\s([\d_]+)/i);
    os = match?.[1] ? `iOS ${match[1].replaceAll("_", ".")}` : "iOS";
  } else if (/Windows NT 10/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X\s([\d_]+)/i);
    os = match?.[1] ? `macOS ${match[1].replaceAll("_", ".")}` : "macOS";
  } else if (/Linux/i.test(ua)) os = "Linux";

  const deviceType = /iPad|Tablet/i.test(ua)
    ? "Tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua)
      ? "Mobile"
      : "Desktop";

  return {
    browser,
    os,
    deviceType,
    deviceLabel: `${browser} on ${os}`
  };
}
