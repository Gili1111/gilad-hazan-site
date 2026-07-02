/* ============================================================
   גלעד חזן — site interactions
   ============================================================ */

/* --- Web3Forms access key (public by design — safe in client-side code) ----
   Contact-form submissions are emailed to guladiosf@gmail.com via Web3Forms.
   The <form> also has a native action="…/submit" fallback so it works with JS off.
----------------------------------------------------------------------------*/
var WEB3FORMS_ACCESS_KEY = "257fe520-9a27-4e90-9a9b-9b48a3052e56";
var CONTACT_EMAIL = "guladiosf@gmail.com";

/* Mark that JS is active — enables the reveal animations defined under html.js.
   Without this class the .reveal content stays fully visible (no-JS safe). */
document.documentElement.classList.add("js");

/* Load web fonts without blocking first paint (CSP-friendly: no inline onload). */
(function () {
  var f = document.createElement("link");
  f.rel = "stylesheet";
  f.href = "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800;900&family=Rubik:wght@500;700;800;900&display=swap";
  document.head.appendChild(f);
})();

document.addEventListener("DOMContentLoaded", function () {
  // year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // mobile menu
  var burger = document.getElementById("hamburger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // header shadow on scroll
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // scroll reveal (progressive enhancement)
  var reveals = document.querySelectorAll(".reveal");
  var revealAll = function () { reveals.forEach(function (el) { el.classList.add("in"); }); };
  var revealInView = function () {
    reveals.forEach(function (el) {
      if (!el.classList.contains("in") && el.getBoundingClientRect().top < window.innerHeight - 40) {
        el.classList.add("in");
      }
    });
  };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            var el = e.target;
            setTimeout(function () { el.classList.add("in"); }, (i % 4) * 90);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
    // Reveal anything already in view right away, and guarantee visibility as a safety net.
    revealInView();
    setTimeout(revealInView, 250);
    setTimeout(function () { if (!document.querySelector(".reveal.in")) revealAll(); }, 1400);
  } else {
    revealAll();
  }

  // WhatsApp invite bubble: appears after a short delay, dismissal remembered for the session
  var bubble = document.getElementById("waBubble");
  var bubbleClose = document.getElementById("waBubbleClose");
  if (bubble && bubbleClose) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("waBubbleDismissed") === "1"; } catch (e) {}
    if (!dismissed) {
      bubble.hidden = false;
      setTimeout(function () { bubble.classList.add("show"); }, 2500);
      bubbleClose.addEventListener("click", function () {
        bubble.classList.remove("show");
        setTimeout(function () { bubble.hidden = true; }, 350);
        try { sessionStorage.setItem("waBubbleDismissed", "1"); } catch (e) {}
      });
      // Clicking through to WhatsApp also dismisses the bubble
      bubble.querySelector("a").addEventListener("click", function () {
        bubble.classList.remove("show");
        try { sessionStorage.setItem("waBubbleDismissed", "1"); } catch (e) {}
      });
    }
  }

  // contact form
  var form = document.getElementById("contactForm");
  var statusEl = document.getElementById("formStatus");
  var btn = document.getElementById("submitBtn");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
      };
      statusEl.className = "form-status";

      // Fallback: no access key configured yet → open mail client
      if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.indexOf("YOUR_") === 0) {
        var subject = encodeURIComponent("פנייה מהאתר — " + data.name);
        var body = encodeURIComponent(
          "שם: " + data.name + "\nאימייל: " + data.email + "\nטלפון: " + data.phone + "\n\n" + data.message
        );
        window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
        statusEl.textContent = "נפתח חלון המייל שלך — שלחו ואחזור אליכם 🙂";
        statusEl.classList.add("ok");
        return;
      }

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = "שולח...";
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "פנייה חדשה מהאתר — " + data.name,
          from_name: "אתר גלעד חזן",
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            form.reset();
            statusEl.textContent = "תודה! הפנייה נשלחה, אחזור אליכם בהקדם.";
            statusEl.classList.add("ok");
          } else {
            statusEl.textContent = "אופס, משהו השתבש. נסו שוב או כתבו לי בוואטסאפ.";
            statusEl.classList.add("err");
          }
        })
        .catch(function () {
          statusEl.textContent = "אין חיבור כרגע. נסו שוב או פנו בוואטסאפ.";
          statusEl.classList.add("err");
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  }
});
