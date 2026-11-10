# TP Notify website (tp-notify-site)

The public website for TP Notify: home page, sign-up, payment success page, and the Terms, Privacy and Refunds policies.
Served by GitHub Pages from `main`. The app itself is the sibling repo `../timepiece-alerts` (live at https://lowballing-coding.github.io/timepiece-alerts/).

## Layout

- Static HTML/CSS/JS, no build step, no package manager. Edit the files directly.
- `config.js` holds the public settings (Stripe Payment Links, promo codes, Supabase URL and publishable key, Turnstile site key, analytics token). Several values must match the app: promo codes, Turnstile key, Supabase project. Never put a secret key in it.
- `tokens.css` holds the "Afterglow" design tokens shared with the app; `styles.css` is the site styles; `site.js` runs on every page; `signup.js` handles sign-up.
- When adding or renaming a page, update `sitemap.xml`.

## Legal pages need care

The site sells Term Passes, Year Passes and a monthly plan to UK consumers. Changes to `terms.html`, `privacy.html`, `refunds.html`, the sign-up flow or prices have legal effect:
- Keep the 14-day cancellation right, prices and pass end dates consistent across `config.js`, the policies and the app.
- When the app starts collecting or keeping new data, the privacy policy must say so.
- Show the postal address only where UK law requires it (Terms, cancellation form).
- Point out any legal question you're unsure about rather than guessing.

## Conventions

- Commit and PR titles are short, plain-English descriptions of the visible change.
- British English. Contact email is tpnotifyupdates@gmail.com.
- Big visible changes (such as home page animations) wait for Peter to review before going live.
- Must look right on phones (light and dark mode via `data-theme="auto"`) and wide desktop screens.

## Checking a change

There are no tests. Preview locally (`.claude/launch.json` serves the folder on port 8001), check phone and desktop widths and both colour schemes, and check the console for errors. On localhost, CORS errors for `cloudflareinsights.com` (analytics) and a failing Turnstile box are expected and can be ignored.

## Keeping this file current

When a session teaches you something lasting about this repo (a rule Peter stated or corrected, a gotcha, a needed check), add it here in the same PR as the work, and fix any line here that turned out to be wrong. Skip one-off details and anything secret.
