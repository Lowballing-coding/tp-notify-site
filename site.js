// Shared by every page: the app link and cookieless analytics (only when its token is set in config.js).
(function () {
  // Never show the site inside someone else's page (stops click-tricking; GitHub Pages can't send the header that does this).
  if (window.top !== window.self) { try { window.top.location = window.location.href; } catch (e) { document.documentElement.hidden = true; } }
  var c = window.TP || {};
  // Phones get a "Get TP Notify" button; computers get a QR code to scan with their phone (styles.css hides the other).
  var ua = navigator.userAgent;
  var phone = /iPhone|iPad|iPod|Android/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.documentElement.className += phone ? " on-phone" : " on-computer";
  var open = document.getElementById("open-app");
  if (c.appUrl) [].forEach.call(document.querySelectorAll("#open-app, .app-link"), function (a) { a.href = c.appUrl; });
  // The welcome page doubles as the "free month started" page.
  if (open && /[?&]free=1\b/.test(location.search)) {
    document.title = "Free Month Started | TP Notify";
    document.querySelector("h1").textContent = "Your Free Month Has Started.";
    document.querySelector(".lead").textContent = "For the next month, Tickets on Sale alerts reach you 30 minutes late and everything else " +
      "arrives instantly. Upgrade any time in the app for instant alerts. Now set up the app on your phone.";
  }
  // A friend's invite link (?ref=CODE): keep the code until sign-up. The app reads the same key (same web address).
  var ref = (new URLSearchParams(location.search).get("ref") || "").trim().toUpperCase();
  if (/^[0-9A-F]{6}$/.test(ref)) { try { localStorage.setItem("tp-ref", JSON.stringify(ref)); } catch (e) {} }

  // Home page: "Live: checked FIXR 20 seconds ago" and how fast recent events sold out. Hidden if the checker is down.
  var live = document.getElementById("live"), stat = document.getElementById("sold-stat"), last = null;
  function span(min) {
    if (min < 1.5) return "a minute";
    if (min < 90) return Math.round(min) + " minutes";
    var h = Math.round(min / 60);
    return h < 48 ? h + " hours" : Math.round(h / 24) + " days";
  }
  function draw() {
    var s = last ? Math.max(0, Math.round((Date.now() - last) / 1000)) : Infinity;
    live.hidden = s > 300;
    live.textContent = "Live: checked FIXR " + (s < 10 ? "just now" : s < 60 ? s + " seconds ago"
      : s < 120 ? "1 minute ago" : Math.floor(s / 60) + " minutes ago") + ".";
  }
  function load() {
    if (document.hidden) return;
    fetch(c.supabaseUrl + "/rest/v1/rpc/public_status", { method: "POST", body: "{}",
      headers: { apikey: c.supabaseKey, "Content-Type": "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        last = j.ok && j.last_check_at ? Date.parse(j.last_check_at) : null;
        draw();
        if (j.sold_out_events >= 3 && j.median_minutes != null) {
          stat.textContent = "Of the recent Timepiece events that sold out, half went within " + span(j.median_minutes) + " of going on sale.";
          stat.hidden = false;
        }
      })
      .catch(function () {});
  }
  if (live && c.supabaseUrl) {
    load();
    setInterval(draw, 10000);
    setInterval(load, 60000);
    document.addEventListener("visibilitychange", load);
  }

  if (c.analyticsToken) {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: c.analyticsToken }));
    document.head.appendChild(s);
  }
})();
