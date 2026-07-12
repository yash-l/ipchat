import { NextRequest } from "next/server";

function configured(name: "PASSKEY_RP_ID" | "PASSKEY_ORIGIN") {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production for secure passkey verification.`);
  }
  return null;
}

export function getRpId(req: NextRequest): string {
  return configured("PASSKEY_RP_ID") ?? new URL(req.url).hostname;
}

export function getExpectedOrigin(req: NextRequest): string {
  const explicit = configured("PASSKEY_ORIGIN");
  if (explicit) return explicit;
  return new URL(req.url).origin;
}

export function transportsToString(value?: string[]): string | null {
  return value?.length ? value.join(",") : null;
}

export function stringToTransports(value?: string | null) {
  return value ? value.split(",").filter(Boolean) as AuthenticatorTransport[] : undefined;
}
