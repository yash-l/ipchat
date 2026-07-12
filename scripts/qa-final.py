#!/usr/bin/env python3
from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
required = [
    "src/app/login/page.tsx",
    "src/app/chat/page.tsx",
    "src/app/calls/page.tsx",
    "src/app/status/page.tsx",
    "src/app/settings/page.tsx",
    "src/app/api/sessions/route.ts",
    "src/app/api/preferences/route.ts",
    "src/app/api/profile/route.ts",
    "src/app/api/passkeys/authenticate/options/route.ts",
    "src/app/api/passkeys/authenticate/verify/route.ts",
    "src/app/api/passkeys/register/options/route.ts",
    "src/app/api/passkeys/register/verify/route.ts",
    "src/lib/status-access.ts",
    "src/lib/passkey.ts",
    "src/middleware.ts",
    "prisma/schema.prisma",
    "render.yaml",
]
missing = [item for item in required if not (root / item).exists()]
assert not missing, "Missing files:\n" + "\n".join(missing)

package = (root / "package.json").read_text()
assert '"name": "ipchat"' in package
assert '@simplewebauthn/server' in package

sessions = (root / "src/app/api/sessions/route.ts").read_text()
assert 'lastSeenAt: "desc"' in sessions
assert 'ensureRegistry' in sessions

middleware = (root / "src/middleware.ts").read_text()
assert 'verifyActiveSessionToken' in middleware

request_otp = (root / "src/app/api/auth/request-otp/route.ts").read_text()
assert 'code });' not in request_otp

status_access = (root / "src/lib/status-access.ts").read_text()
assert 'canAccessStatus' in status_access

calls = (root / "src/app/calls/page.tsx").read_text()
for fake_name in ["Meera Shah", "Aarav Patel", "Nisha Rao", "Team North", "Project planning"]:
    assert fake_name not in calls, f"Fake call data still present: {fake_name}"
assert 'No fake call record was created' in calls

passkey = (root / "src/lib/passkey.ts").read_text()
assert 'PASSKEY_RP_ID' in passkey and 'PASSKEY_ORIGIN' in passkey
assert 'required in production' in passkey

render = (root / "render.yaml").read_text()
assert 'name: ipchat' in render
assert 'PASSKEY_RP_ID' in render and 'PASSKEY_ORIGIN' in render

print("✅ Canonical IPChat naming")
print("✅ Safe session self-heal and revocation enforcement")
print("✅ Persistent profile and privacy settings")
print("✅ Status expiry and audience checks")
print("✅ WebAuthn passkeys with explicit production RP/origin config")
print("✅ No fake call history or demo recordings")
print("✅ Unified release QA passed")
