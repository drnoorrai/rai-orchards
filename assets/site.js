(function () {
  "use strict";

  var panel = document.getElementById("menuPanel");
  var scrim = document.getElementById("menuScrim");
  var openButton = document.getElementById("menuOpen");
  var closeButton = document.getElementById("menuClose");
  var lastFocused = null;

  function setMenu(open) {
    if (!panel || !scrim || !openButton) return;
    panel.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    openButton.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      lastFocused = document.activeElement;
      if (closeButton) closeButton.focus();
    } else if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  if (panel && scrim && openButton) {
    panel.hidden = false;
    scrim.hidden = false;
    openButton.addEventListener("click", function () { setMenu(true); });
    if (closeButton) closeButton.addEventListener("click", function () { setMenu(false); });
    scrim.addEventListener("click", function () { setMenu(false); });
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) setMenu(false);
      if (event.key === "Tab" && panel.classList.contains("is-open")) {
        var focusable = panel.querySelectorAll('a[href], button:not([disabled])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  var liveStatus = document.querySelectorAll("[data-live-status]");
  var statusDots = document.querySelectorAll("[data-status-dot]");
  if (liveStatus.length) {
    try {
      var parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).formatToParts(new Date());
      var values = {};
      parts.forEach(function (part) { values[part.type] = part.value; });
      var hour = Number(values.hour);
      var minute = Number(values.minute);
      var current = hour * 60 + minute;
      var shopDay = values.weekday !== "Sun";
      var opensAt = 8 * 60;
      var closesAt = 18 * 60;
      var open = shopDay && current >= opensAt && current < closesAt;
      var message;
      if (open) message = "Open today · Farm shop 8–6";
      else if (!shopDay) message = "Closed today · Farm shop opens Monday at 8";
      else if (current < opensAt) message = "Closed now · Farm shop opens at 8";
      else if (values.weekday === "Sat") message = "Closed now · Farm shop opens Monday at 8";
      else message = "Closed now · Farm shop opens tomorrow at 8";
      var today = values.year + "-" + values.month + "-" + values.day;

      // Hide the holiday banner once its last day has passed.
      var banner = document.querySelector("[data-holiday-until]");
      if (banner && today > banner.getAttribute("data-holiday-until")) banner.hidden = true;
      liveStatus.forEach(function (node) { node.textContent = message; });
      statusDots.forEach(function (node) { node.setAttribute("data-state", open ? "open" : "closed"); });
    } catch (error) {
      /* The server-rendered schedule remains visible as a safe fallback. */
    }
  }

  var signup = document.querySelector("[data-signup-form]");
  if (signup && window.fetch) {
    signup.addEventListener("submit", function (event) {
      event.preventDefault();
      var button = signup.querySelector('button[type="submit"]');
      var message = document.getElementById("signup-message");
      var original = button ? button.textContent : "";
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      if (message) { message.textContent = ""; message.removeAttribute("data-state"); }
      fetch(signup.action, {
        method: "POST",
        body: new FormData(signup),
        headers: { "Accept": "application/json" }
      }).then(function (response) {
        if (!response.ok) throw new Error("Submission failed");
        signup.reset();
        if (message) {
          message.textContent = "You’re on the list. We’ll send a note when the harvest changes.";
          message.setAttribute("data-state", "success");
        }
      }).catch(function () {
        if (message) {
          message.textContent = "That didn’t go through. Please try again or email info@raiorchards.ca.";
          message.setAttribute("data-state", "error");
        }
      }).finally(function () {
        if (button) { button.disabled = false; button.textContent = original; }
      });
    });
  }
})();
