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

Ensure **Authentication → URL configuration** includes:

- `https://your-domain.com/auth/callback`
- `http://localhost:3000/auth/callback` (local)

Reset flow redirects to `/login/reset-password` via the app’s forgot-password handler.
