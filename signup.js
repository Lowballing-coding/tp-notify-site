// Website sign-up: create the account (or sign in), then go to the Stripe Payment Link with the account id attached,
// so the payment webhook can approve exactly this account. The site never sees card details or any secret key.
(function () {
  var c = window.TP || {};
  var $ = function (id) { return document.getElementById(id); };
  var asked = new URLSearchParams(location.search).get("plan");
  var plan = asked === "quarterly" || asked === "free" ? asked : "monthly";
  var signIn = false, captchaToken = null, widget = null;

  // ---- Plan choice ----
  function showPlan() {
    document.querySelectorAll(".plan-opt").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.plan === plan)); });
    if (signIn) return;
    $("submit").textContent = plan === "free" ? "Create Account and Start Free Month" : "Create Account and Continue to Payment";
    $("lead").textContent = plan === "free"
      ? "Your free month starts as soon as you create your account. No card needed. Upgrade any time for instant alerts."
      : "Then pay securely with Stripe. Your account is approved automatically as soon as the payment goes through.";
  }
  document.querySelectorAll(".plan-opt").forEach(function (b) { b.onclick = function () { plan = b.dataset.plan; showPlan(); }; });
  showPlan();

  // ---- Password strength (0 Too Short, 1 Weak, 2 Okay, 3 Strong, 4 Very Strong). Same rules as the app. ----
  var LABELS = ["Too Short", "Weak", "Okay", "Strong", "Very Strong"];
  function strength(pw) {
    if (pw.length < 8) return 0;
    if (/^(password|qwerty|letmein|welcome|iloveyou|12345678|abc123|11111111)/i.test(pw) || /(.)\1{3,}/.test(pw) || /^\d+$/.test(pw)) return 1;
    var s = 1;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  }
  $("pass").addEventListener("input", function () {
    var pw = $("pass").value, s = strength(pw);
    $("meter").className = "meter s" + (pw ? s : "");
    $("meter-label").textContent = pw ? "Password strength: " + LABELS[s] + (s < 2 ? ". Use at least 8 characters and avoid common passwords." : ".")
      : "At least 8 characters. A longer mix of words, numbers and symbols is stronger.";
  });

  // ---- Spam check (Cloudflare Turnstile), only when a site key is set ----
  window.tpTurnstileReady = function () {
    widget = window.turnstile.render("#captcha", {
      sitekey: c.turnstileSiteKey, theme: "auto",
      callback: function (t) { captchaToken = t; },
      "expired-callback": function () { captchaToken = null; },
      "error-callback": function () { captchaToken = null; },
    });
  };
  if (c.turnstileSiteKey) {
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=tpTurnstileReady";
    s.async = true;
    document.head.appendChild(s);
  }
  function resetCaptcha() { captchaToken = null; if (widget !== null && window.turnstile) window.turnstile.reset(widget); }

  // ---- Sign up / sign in mode ----
  function setMode(toSignIn) {
    signIn = toSignIn;
    ["f-name", "f-confirm", "f-agree"].forEach(function (id) { $(id).hidden = signIn; });
    $("meter").hidden = signIn; $("meter-label").hidden = signIn;
    $("pass").autocomplete = signIn ? "current-password" : "new-password";
    $("title").textContent = signIn ? "Sign In to Pay" : "Create Your Account";
    if (signIn) $("lead").textContent = "Sign in with the account you made, then choose a plan and pay.";
    $("toggle").textContent = signIn ? "Create a New Account" : "I Already Have an Account";
    if (signIn && plan === "free") plan = "monthly";   // signing in here is only for paying
    document.querySelector('.plan-opt[data-plan="free"]').hidden = signIn;
    $("submit").textContent = signIn ? "Sign In and Continue to Payment" : "";
    showPlan();
    say("");
  }
  $("toggle").onclick = function () { setMode(!signIn); };

  function say(text, ok) { var m = $("msg"); m.textContent = text; m.className = "form-msg" + (text && !ok ? " error" : ""); }

  // An error goes right under the field it's about, is announced to screen readers, and that field gets focus.
  function fieldError(id, text) {
    var input = $(id), after = id === "agree" ? $("f-agree") : input, e = $(id + "-error");
    if (!e) { e = document.createElement("p"); e.id = id + "-error"; e.className = "field-error"; after.insertAdjacentElement("afterend", e); }
    e.textContent = text; e.setAttribute("role", "alert");
    input.setAttribute("aria-invalid", "true");
    if ((input.getAttribute("aria-describedby") || "").indexOf(e.id) < 0) {
      input.setAttribute("aria-describedby", ((input.getAttribute("aria-describedby") || "") + " " + e.id).trim());
    }
    input.focus();
  }
  function clearError(input) {
    var e = $(input.id + "-error");
    if (e) e.textContent = "";
    input.removeAttribute("aria-invalid");
  }
  $("form").addEventListener("input", function (ev) { if (ev.target.id) clearError(ev.target); });
  $("form").addEventListener("change", function (ev) { if (ev.target.id === "agree") clearError(ev.target); });

  // ---- Supabase calls (public publishable key; the database rules do the locking) ----
  function call(method, path, body, token) {
    var h = { apikey: c.supabaseKey, "Content-Type": "application/json" };
    if (token) h.Authorization = "Bearer " + token;
    return fetch(c.supabaseUrl + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined })
      .catch(function () { throw new Error("No connection. Check your internet and try again."); })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) throw new Error(friendly(r.status, j && (j.msg || j.error_description || j.message)));
          return j;
        });
      });
  }

  // Sign-in messages are readable; database errors are not, so those become plain English. Same rules as the app.
  function friendly(status, raw) {
    if (raw && !/violates|constraint|PGRST|JWT|relation|column|syntax|uuid|row-level|Not allowed/i.test(raw)) return raw;
    if (status === 429) return "Too many tries in a row. Wait a minute, then try again.";
    if (status >= 500) return "Our server is having a problem. Please try again in a minute.";
    return "Something went wrong. Please try again, or email TPNotify@outlook.com if it keeps happening.";
  }

  function goPay(userId, email) {
    if (plan === "free") { location.href = "success.html?free=1"; return; }   // every new account starts a free month
    var link = plan === "quarterly" ? c.payQuarterly : c.payMonthly;
    if (!link) { say("Your account is ready. Payments aren't open yet, so we'll be in touch soon.", true); return; }
    location.href = link + (link.indexOf("?") < 0 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(userId) +
      "&prefilled_email=" + encodeURIComponent(email) +
      (plan === "monthly" && c.promoMonthly ? "&prefilled_promo_code=" + encodeURIComponent(c.promoMonthly) : "");
  }

  // ---- Submit ----
  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = $("name").value.trim(), email = $("email").value.trim(), pw = $("pass").value;
    say("");
    if (!signIn && !name) return fieldError("name", "Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fieldError("email", "Please enter a valid email address, like name@example.com.");
    if (!signIn && strength(pw) < 2) return fieldError("pass", "Please choose a stronger password: at least 8 characters, and not a common one.");
    if (signIn && !pw) return fieldError("pass", "Please enter your password.");
    if (!signIn && pw !== $("confirm").value) return fieldError("confirm", "The two passwords don't match.");
    if (!signIn && !$("agree").checked) return fieldError("agree", "Please tick the box to agree to the Terms and Privacy Policy.");
    if (c.turnstileSiteKey && !captchaToken) return say("Please complete the check above the button.");

    var btn = $("submit"), label = btn.textContent;
    btn.disabled = true; btn.textContent = signIn ? "Signing In..." : "Creating Your Account..."; say("");
    var security = captchaToken ? { captcha_token: captchaToken } : undefined;
    var body = { email: email, password: pw, gotrue_meta_security: security };
    if (!signIn) body.data = { name: name };

    call("POST", signIn ? "/auth/v1/token?grant_type=password" : "/auth/v1/signup", body)
      .then(function (j) {
        var user = (j && j.user) || j, token = j && j.access_token;
        if (!user || !user.id) throw new Error("Something went wrong. Please try again, or email TPNotify@outlook.com if it keeps happening.");
        if (!token) return goPay(user.id, email);   // email confirmation is on: no session yet, the id is enough to pay
        var steps = [];
        if (!signIn) steps.push(call("PATCH", "/rest/v1/profiles?id=eq." + user.id, { display_name: name }, token).catch(function () {}));
        return Promise.all(steps).then(function () {
          return call("GET", "/rest/v1/profiles?id=eq." + user.id + "&select=access", null, token).catch(function () { return []; });
        }).then(function (rows) {
          var access = rows && rows[0] && rows[0].access;
          if (access === "paid" || access === "comped") {   // already paying, or free from the owner: nothing to pay
            say("You already have instant alerts, so there's nothing to pay. Open the app and sign in.", true);
            return;
          }
          goPay(user.id, email);
        });
      })
      .catch(function (e) {
        var m = e.message || "";
        if (/already registered/i.test(m)) return fieldError("email", "That email already has an account. Tap I Already Have an Account to sign in.");
        say(/invalid login/i.test(m) ? "Email or password is wrong."
          : /captcha/i.test(m) ? "The spam check failed. Please try it again."
          : m);
      })
      .then(function () { btn.disabled = false; btn.textContent = label; resetCaptcha(); });
  });

  setMode(new URLSearchParams(location.search).get("mode") === "signin");
})();
