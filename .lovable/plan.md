
## Session & Token Management Upgrade Plan

### What Already Exists
- `user_sessions` table (basic: id, user_id, device_info, ip_address, is_active, session_token_hash)
- `security_events` table with logging
- `trusted_devices` table (from PIN system)
- `auth_audit_log` table
- `security-audit` edge function (has session revocation)
- Device fingerprinting (`src/lib/deviceFingerprint.ts`)

### Important Architecture Note
**Supabase Auth manages JWT tokens, refresh tokens, and token rotation internally.** We cannot override JWT expiry, add custom claims, or control refresh token hashing at that level. What we CAN do is build a **session tracking layer on top** that monitors, controls, and secures the auth lifecycle.

### Phase 1: Database Enhancement
Enhance `user_sessions` table with:
- `device_fingerprint` — SHA-256 browser fingerprint
- `device_name`, `device_os` — human-readable device info
- `location_country`, `location_city` — geo from IP (optional)
- `expires_at` — session expiry timestamp
- `login_method` — how the user logged in (email/phone/pin/social)

### Phase 2: Session Manager Edge Function
Create `session-manager` edge function with actions:
- `create_session` — called on login, records device/IP/fingerprint
- `list_sessions` — returns user's active sessions
- `revoke_session` — revoke a specific session
- `revoke_all_sessions` — revoke all except current
- `heartbeat` — update last_active_at
- `check_suspicious` — compare login context with history (country change, new device, unusual time)

### Phase 3: Frontend Integration
- Enhance `AuthContext` to create a session on login via onAuthStateChange
- Add session heartbeat (periodic last_active_at update)
- Create `useSessionManager` hook for session list/revoke operations
- Enhance SecuritySettings component with active sessions list + revoke buttons

### Phase 4: Suspicious Login Detection
- On each login, compare with last known session
- Country change → log security event + flag
- New device fingerprint → log security event
- Unusual time (2-5 AM user local) → flag for review
- All detections logged to `security_events`

### Phase 5: Session Cleanup
- Add cleanup logic in edge function to deactivate expired sessions
- Can be triggered by the existing scheduled workflows infrastructure
