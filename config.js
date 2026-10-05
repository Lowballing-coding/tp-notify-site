// Public settings for the site. Everything here is safe to publish. Never put a secret key in this file
// (no Stripe secret key, no Supabase secret key, no Turnstile secret key).
window.TP = {
  // Stripe Payment Links (start with test-mode links). Empty = "Payments open soon" after sign-up.
  payMonthly: "",     // £4.99 a month, £3.99 first month
  payQuarterly: "",   // £11.99 every 3 months
  promoMonthly: "",   // promotion code that makes the first month £3.99 (must match PROMO_MONTHLY in the app)
  appUrl: "https://lowballing-coding.github.io/timepiece-alerts/",
  // Same Supabase project as the app. The publishable key is public by design; the database rules do the locking.
  supabaseUrl: "https://ddeapflekaecxqetayil.supabase.co",
  supabaseKey: "sb_publishable_3Y_Na0OOoVnveCA6iBgwtg_3xnII6fu",
  // Cloudflare Turnstile SITE key (public). Empty = no spam check yet. Must match the app's TURNSTILE_SITE_KEY.
  turnstileSiteKey: "0x4AAAAAAFOxe4Sm4jFD1ucJ",
  // Cloudflare Web Analytics token (public, cookieless). Empty = no analytics.
  analyticsToken: "9a300d8ecc6343d4bb8def311b3ee574",
};
