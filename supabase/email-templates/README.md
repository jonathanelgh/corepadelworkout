# Supabase Auth email templates

Branded templates for **Core Padel Workout** (dark `#0a0a0a`, accent `#ccff00`).

Paste these into **Supabase Dashboard → Authentication → Email templates**.

## Confirm signup

1. Open **Confirm signup**
2. **Subject:** copy from `confirm-signup-subject.txt`
3. **Body:** paste the full HTML from `confirm-signup.html`

## Reset password

1. Open **Reset password**
2. **Subject:** copy from `reset-password-subject.txt`
3. **Body:** paste the full HTML from `reset-password.html`

Variables used (provided by Supabase — do not rename):

| Variable | Purpose |
|----------|---------|
| `{{ .ConfirmationURL }}` | Confirm or reset link |
| `{{ .Email }}` | User email |
| `{{ .SiteURL }}` | Site URL from project settings |

## Redirect URLs

Ensure **Authentication → URL configuration** includes (add every domain you use):

- `https://your-domain.com/auth/callback`
- `https://your-domain.com/auth/recovery`
- `https://your-domain.com/login/reset-password`
- `http://localhost:3000/auth/callback` (local)
- `http://localhost:3000/auth/recovery` (local)
- `http://localhost:3000/login/reset-password` (local)

Set **Site URL** to your app root (e.g. `https://corepadel.app`), not a deep path.

Password reset emails use `/auth/recovery`, which exchanges the link and sends users to `/login/reset-password`. If `/auth/recovery` is missing from the allowlist, Supabase falls back to Site URL (`/`) and users only see the landing page.
