# Cloudflare personal deployment

User-approved scope: move the existing reading vocabulary app to the user's own Cloudflare account, start with Free, preserve records, and provide independent sign-in and backups. No paid plan activation or deletion of the existing Sites deployment.

Implementation plan:
1. Wrap the existing built Worker with a private entrypoint; require a generated high-entropy password and signed, expiring HttpOnly cookie. Strip all incoming Sites identity headers before supplying the fixed personal identity. Never expose the unwrapped Worker.
2. Provide authenticated JSON export. Keep existing application behavior and UI, with standalone backup/sign-out links.
3. Stage a separate Workers deployment with D1 bindings, assets, migrations and private secrets, retaining the Sites build path. Secret files and database backups are ignored by Git.
4. Snapshot the source database, create a new personal D1 database, import only the owner's data, and compare row counts. Do not import local QA sessions.
5. Run auth/session tests, type checking, production build, local Worker integration tests, then deploy and verify protected endpoints and record counts. Do not activate billing.

Auth design: a random generated password (at least 24 characters), SHA-256 digest in a Worker secret, HMAC signed cookie tied to that digest with a seven-day expiry, SameSite=Strict, Secure and HttpOnly. Password rotation invalidates cookies. No registration or password-by-email flow. Sign-out uses same-origin POST. Missing configuration fails closed. Non-cookie spoofed identity headers must never grant access.

Backup: schema-versioned raw sessions and attempts scoped to the personal identity, downloaded with no-store. Imports are performed through the local authenticated deployment CLI, not through a public API. Session IDs and timestamps are preserved; progress is derived from attempts as in the existing app.

Account authorization remains a deployment prerequisite. OAuth is performed by the user in the official Cloudflare page, without sharing credentials in chat. The original Sites address continues to work until the new site is verified. New answers made on the original after the migration snapshot are not automatically synchronized.
