# Panda Go Cloudflare test deployment
Separate copy of tested main 495b081de2e4ae9d73696d279c542515b9578a98. No production Vercel/Supabase changes, domain cutover or API integration.
Worker name: chinese-coach-pwa (existing Cloudflare test Worker).
Production branch FOR THIS TEST WORKER ONLY: cloudflare-panda-go-test-20261126.
Build command: node scripts/prepare-cloudflare-panda.cjs
Deploy command: npx wrangler deploy
Root directory: /
Disable non-production preview builds. Leave existing build token. No new secrets.
The builder creates .cloudflare-dist from tracked public frontend assets only. Excludes repository metadata, backups, server code, scripts, test directories, archives, and credentials. Retains public attribution/license notices. Removes two developer-only scripts from the generated offline pack and recomputes estimated bytes; source offline pack unchanged. Explicit HTML paths retained; root redirects to index.html. No custom domain. workers.dev enabled, subject to account availability.
Source inventory: 4548 files, 3361 MP3, no file >25MiB, 3933 required shell/offline/entry URLs checked by path. Source syntax check and inventory only, not actual Cloudflare build or browser test. Verify real deployment, MP3 Range requests, PWA shell, microphone, navigation, auth/CORS separately. Origin-local storage does not automatically transfer between domains. No live AI API, new database or billing changes.
