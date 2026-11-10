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
    document.querySelector(".lead").textContent = "For the next month, your first Tickets on Sale alert arrives instantly, later ones 30 minutes late, and " +
      "everything else instantly. Upgrade any time in the app for instant alerts. Now set up the app on your phone.";
  }
  // A friend's invite link (?ref=CODE): keep the code until sign-up. The app reads the same key (same web address).
  var ref = (new URLSearchParams(location.search).get("ref") || "").trim().toUpperCase();
  if (/^[0-9A-F]{6}$/.test(ref)) { try { localStorage.setItem("tp-ref", JSON.stringify(ref)); } catch (e) {} }
  // Where a visitor came from (?from=ig-bio on an Instagram link): carried in the sign-up links' address, never stored
  // on the device, and saved on the profile at sign-up so the Admin tab can count sign-ups and paying members per source.
  var from = (new URLSearchParams(location.search).get("from") || "").trim().toLowerCase();
  if (/^[a-z0-9-]{1,32}$/.test(from)) [].forEach.call(document.querySelectorAll('a[href^="signup.html"]'), function (a) {
    var h = a.getAttribute("href"); a.setAttribute("href", h + (h.indexOf("?") < 0 ? "?" : "&") + "from=" + from);
  });
  var invited = document.getElementById("invited-home");
  try { if (invited && /^"[0-9A-F]{6}"$/.test(localStorage.getItem("tp-ref") || "")) invited.hidden = false; } catch (e) {}

  // Early-bird prices: after their real deadline, show the normal price instead.
  document.querySelectorAll("[data-until]").forEach(function (el) {
    if (Date.now() < Date.parse(el.dataset.until)) return;
    if (el.dataset.late) el.textContent = el.dataset.late; else el.hidden = true;
  });

  // Home page: "Live: checked FIXR 20 seconds ago" and how fast recent events sold out. Hidden if the checker is down.
  var live = document.getElementById("live"), stat = document.getElementById("sold-stat"), recent = document.getElementById("recent"), last = null;
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
        // The honest reason to pay: free alerts arrive 30 minutes late, and this many nights were gone by then.
        if (j.sold_out_events >= 5 && j.under_30 >= 2) {
          var hp = document.getElementById("hero-proof"), pp = document.getElementById("price-proof");
          if (hp) { hp.textContent = j.under_30 + " of the last " + j.sold_out_events + " Timepiece nights that sold out were gone within 30 minutes."; hp.hidden = false; }
          if (pp) { pp.textContent = "On the free month, on-sale alerts after your first arrive 30 minutes late. " + j.under_30 + " of the last " + j.sold_out_events + " sold-out nights were gone by then."; pp.hidden = false; }
        }
        if (j.sold_out_events >= 3 && j.median_minutes != null) {
          stat.textContent = "Of the recent Timepiece events that sold out, half went within " + span(j.median_minutes) + " of going on sale.";
          stat.hidden = false;
        }
        // The last few nights, as proof: "Saturday 17.10 sold out within 11 minutes."
        if (recent && j.recent && j.recent.length && recent.hidden) {
          j.recent.forEach(function (e) {
            if (!e.name || !(e.minutes > 0)) return;
            var li = document.createElement("li");
            li.textContent = e.name + " sold out within " + span(e.minutes) + " of going on sale.";
            recent.appendChild(li);
          });
          recent.hidden = !recent.children.length;
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

  // Motion: the phone story's screen follows the chapter in the middle of the window, and sections fade up as they arrive.
  var screen = document.getElementById("story-screen");
  if (screen && "IntersectionObserver" in window) {
    var chapters = [].slice.call(document.querySelectorAll(".ch"));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        chapters.forEach(function (ch) { ch.classList.toggle("on", ch === e.target); });
        screen.dataset.v = chapters.indexOf(e.target);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach(function (ch) { io.observe(ch); });
  }
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion");
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    [].forEach.call(document.querySelectorAll("main > section:not(.hero):not(.story) > .wrap, main > section.wrap:not(.hero)"), function (el) {
      el.classList.add("reveal"); rv.observe(el);
    });

    // Screen to phone: the lock screen arrives filling the whole window, then shrinks back into the phone as you
    // scroll through the room above chapter 1 (styles.css: .motion .story-phone + .ch margin-top). The screen box
    // itself changes size, so its clock and alert lay out for each size instead of being stretched.
    var stick = document.querySelector(".story-phone"), phone = stick && stick.querySelector(".phone"), grid = document.querySelector(".story-grid");
    if (phone && screen) {
      var rest, queued = false, vars = ["--sx", "--sy", "--sw", "--sh"];
      var measure = function () {   // the screen's resting box inside the phone, and the phone's scale (smaller on phones)
        vars.forEach(function (v) { stick.style.removeProperty(v); });
        var p = phone.getBoundingClientRect();
        rest = { x: screen.offsetLeft, y: screen.offsetTop, w: screen.offsetWidth, h: screen.offsetHeight, k: p.width / phone.offsetWidth,
          top: (parseFloat(getComputedStyle(stick).top) || 0) + (p.top - stick.getBoundingClientRect().top) };
      };
      var draw = function () {
        queued = false;
        var vw = document.documentElement.clientWidth, vh = innerHeight, k = rest.k, p = phone.getBoundingClientRect();
        var t = Math.min(1, Math.max(0, (rest.top - grid.getBoundingClientRect().top) / (vh * 0.9)));
        var u = 1 - t * t * (3 - 2 * t);   // 1 = fills the window, 0 = back in the phone (eased)
        var lerp = function (a, b) { return a + (b - a) * u; };
        // the window's box in the phone's own pixels, measured from where the phone will be once it sticks,
        // so before then the big screen scrolls up with the page like any other section
        stick.style.setProperty("--sx", lerp(rest.x, -p.left / k - 1) + "px");
        stick.style.setProperty("--sy", lerp(rest.y, -rest.top / k - 1) + "px");
        stick.style.setProperty("--sw", lerp(rest.w, vw / k) + "px");
        stick.style.setProperty("--sh", lerp(rest.h, vh / k) + "px");
        stick.style.setProperty("--z", (1 - u).toFixed(3));
      };
      var ask = function () { if (!queued) { queued = true; requestAnimationFrame(draw); } };
      measure(); draw();
      addEventListener("scroll", ask, { passive: true });
      addEventListener("resize", function () { measure(); draw(); });
    }
  }

  if (c.analyticsToken) {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: c.analyticsToken }));
    document.head.appendChild(s);
  }
})();
