(function () {
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var backdrop = document.querySelector(".nav-backdrop");

  function placeDrawer() {
    var mast = document.querySelector(".mast");
    if (!nav || !mast) return;
    var height = mast.offsetHeight;
    nav.style.top = height + "px";
    nav.style.height = "calc(100dvh - " + height + "px)";
  }

  function setNav(open) {
    if (!nav || !toggle) return;
    if (open) placeDrawer();
    nav.classList.toggle("is-open", open);
    if (backdrop) backdrop.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }

  window.addEventListener("resize", function () {
    if (!nav) return;
    if (window.matchMedia("(min-width: 990px)").matches) {
      nav.style.top = "";
      nav.style.height = "";
      setNav(false);
      return;
    }
    if (nav.classList.contains("is-open")) placeDrawer();
  });

  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });
  }
  if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });

  document.querySelectorAll(".sub-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".has-sub");
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setNav(false);
  });

  var root = document.querySelector("[data-slideshow]");
  if (root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slide"));
    var currentEl = root.querySelector("[data-current]");
    var prev = root.querySelector("[data-dir='-1']");
    var next = root.querySelector("[data-dir='1']");
    var autoplayBtn = root.querySelector("[data-autoplay]");
    var index = 0;
    var timer = null;
    var paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = 7000;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        if (active) slide.removeAttribute("tabindex");
      });
      if (currentEl) currentEl.textContent = String(index + 1);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (paused) return;
      timer = window.setInterval(function () { show(index + 1); }, delay);
    }

    function setPaused(value) {
      paused = value;
      if (autoplayBtn) {
        autoplayBtn.classList.toggle("is-paused", paused);
        autoplayBtn.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
      }
      if (paused) stop();
      else start();
    }

    if (prev) prev.addEventListener("click", function () { show(index - 1); start(); });
    if (next) next.addEventListener("click", function () { show(index + 1); start(); });
    if (autoplayBtn) autoplayBtn.addEventListener("click", function () { setPaused(!paused); });

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { show(index - 1); start(); }
      if (event.key === "ArrowRight") { show(index + 1); start(); }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (!paused) start();
    });

    show(0);
    setPaused(paused);
  }

  var endpoint = "https://agii-vapi-bridge-9383.twil.io/web-contact";

  document.querySelectorAll("form[data-intake]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-status]");
      var submit = form.querySelector("[type='submit']");
      var data = Object.fromEntries(new FormData(form).entries());
      data.business = "TSW";
      data.source = form.getAttribute("data-source") || "txshirtworks.com";

      var missing = false;
      form.querySelectorAll("[required]").forEach(function (field) {
        if (!String(field.value || "").trim()) missing = true;
      });
      if (missing) {
        if (status) {
          status.textContent = "Please complete the required fields.";
          status.classList.add("is-error");
        }
        return;
      }

      if ((data.website || "").trim()) {
        form.reset();
        if (status) {
          status.textContent = "Got it — we'll be in touch shortly.";
          status.classList.remove("is-error");
        }
        return;
      }

      if (!data.email && !data.phone) {
        if (status) {
          status.textContent = "Please provide an email or phone number so we can reach you.";
          status.classList.add("is-error");
        }
        return;
      }

      if (form.id === "custom-form") {
        var lines = [
          "Custom apparel intake",
          "Organization: " + (data.organization || "—"),
          "Use case: " + (data.use_case || "—"),
          "Garments: " + (data.garments || "—"),
          "Approximate quantity: " + (data.quantity || "—"),
          "Needed by: " + (data.needed_by || "—"),
          "Artwork: " + (data.artwork || "—"),
          "",
          data.details || ""
        ];
        data.message = lines.join("\n");
      }

      if (status) {
        status.textContent = "Sending…";
        status.classList.remove("is-error");
      }
      if (submit) submit.disabled = true;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (!response.ok) throw new Error("bad status");
        form.reset();
        if (window.turnstile && typeof window.turnstile.reset === "function") {
          window.turnstile.reset();
        }
        if (status) status.textContent = "Got it — we'll be in touch shortly.";
      }).catch(function () {
        if (status) {
          status.textContent = "Something went wrong. Please call (936) 448-5900 or email support@txshirtworks.com.";
          status.classList.add("is-error");
        }
      }).finally(function () {
        if (submit) submit.disabled = false;
      });
    });
  });
})();
