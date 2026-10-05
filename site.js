// Shared by every page: the app link and cookieless analytics (only when its token is set in config.js).
(function () {
  // Never show the site inside someone else's page (stops click-tricking; GitHub Pages can't send the header that does this).
  if (window.top !== window.self) { try { window.top.location = window.location.href; } catch (e) { document.documentElement.hidden = true; } }
  var c = window.TP || {};
  var open = document.getElementById("open-app");
  if (open && c.appUrl) open.href = c.appUrl;
  // The welcome page doubles as the "free month started" page.
  if (open && /[?&]free=1\b/.test(location.search)) {
    document.title = "Free Month Started | TP Notify";
    document.querySelector("h1").textContent = "Your Free Month Has Started.";
    document.querySelector(".lead").textContent = "For the next month, Tickets on Sale alerts reach you 30 minutes late and everything else " +
      "arrives instantly. Upgrade any time in the app for instant alerts. Now set up the app on your phone.";
  }
  if (c.analyticsToken) {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: c.analyticsToken }));
    document.head.appendChild(s);
  }
})();
