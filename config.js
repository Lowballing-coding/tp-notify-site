// Public settings for the site. Everything here is safe to publish. Never put a secret key in this file
// (no Stripe secret key, no Supabase secret key, no Turnstile secret key).
window.TP = {
  // Stripe Payment Links (LIVE, made by the stripe-setup function on 8 Nov 2026). Empty = "Payments open soon" after sign-up.
  payYear: "https://buy.stripe.com/14AeVcbGjazXaBP7JX6wE02",      // Year Pass, £24.99 once, to 11 June 2027
  payTerm: "https://buy.stripe.com/8x2cN4fWz0Zn25j6FT6wE01",      // Term Pass, £11.99 once, to 26 March 2027
  payMonthly: "https://buy.stripe.com/14A4gycKngYldO1d4h6wE00",   // £4.99 a month, £3.99 first month
  promoMonthly: "FIRSTMONTH",   // makes the first month £3.99 (must match PROMO_MONTHLY in the app)
  promoTerm: "EARLYSPRING",     // early-bird Term Pass £9.99; Stripe stops accepting it after promoTermUntil
  promoTermUntil: "2026-12-11T23:59:59Z",
  appUrl: "https://lowballing-coding.github.io/timepiece-alerts/",
  // Same Supabase project as the app. The publishable key is public by design; the database rules do the locking.
  supabaseUrl: "https://ddeapflekaecxqetayil.supabase.co",
  supabaseKey: "sb_publishable_3Y_Na0OOoVnveCA6iBgwtg_3xnII6fu",
  // Cloudflare Turnstile SITE key (public). Empty = no spam check yet. Must match the app's TURNSTILE_SITE_KEY.
  turnstileSiteKey: "0x4AAAAAAFOxe4Sm4jFD1ucJ",
  // Cloudflare Web Analytics token (public, cookieless). Empty = no analytics.
  analyticsToken: "9a300d8ecc6343d4bb8def311b3ee574",
};
