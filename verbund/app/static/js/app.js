// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";
  var root = document.documentElement;

  // Light / dark toggle, remembered on this device.
  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      if (!current) current = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("vb-theme", next); } catch (e) { /* ignore */ }
    });
  });

  // Filters apply as soon as they change (the Apply button is hidden when JS runs).
  document.querySelectorAll("form[data-autosubmit]").forEach(function (form) {
    var timer;
    form.querySelectorAll("select").forEach(function (el) {
      el.addEventListener("change", function () { form.requestSubmit ? form.requestSubmit() : form.submit(); });
    });
    form.querySelectorAll("input[type=search]").forEach(function (el) {
      el.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.submit(); }, 400);
      });
    });
  });
  // Keep the cursor in the search box after it re-submits.
  var search = document.querySelector("input[type=search][data-keep-focus]");
  if (search && search.value) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }

  // Bulk approve: live count and "select all".
  document.querySelectorAll("[data-bulk]").forEach(function (form) {
    var boxes = form.querySelectorAll("input[name=match_ids]");
    var counter = form.querySelector("[data-bulk-count]");
    var submit = form.querySelector("[data-bulk-submit]");
    var all = form.querySelector("[data-bulk-all]");
    function update() {
      var n = Array.prototype.filter.call(boxes, function (b) { return b.checked; }).length;
      if (counter) counter.textContent = n;
      if (submit) submit.disabled = n === 0;
      if (all) all.checked = n > 0 && n === boxes.length;
    }
    boxes.forEach(function (b) { b.addEventListener("change", update); });
    if (all) all.addEventListener("change", function () {
      boxes.forEach(function (b) { b.checked = all.checked; });
      update();
    });
    update();
  });

  // Weights must add up to 100: show the running total.
  document.querySelectorAll("[data-weights]").forEach(function (form) {
    var inputs = form.querySelectorAll("input[type=number]");
    var total = form.querySelector("[data-weights-total]");
    var save = form.querySelector("[data-weights-save]");
    function update() {
      var sum = 0;
      inputs.forEach(function (i) { sum += parseInt(i.value || "0", 10) || 0; });
      total.textContent = sum;
      total.classList.toggle("ok", sum === 100);
      total.classList.toggle("warn", sum !== 100);
      if (save) save.disabled = sum !== 100;
    }
    inputs.forEach(function (i) { i.addEventListener("input", update); });
    update();
  });

  // Ask before destructive actions.
  document.querySelectorAll("form[data-confirm]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.confirm(form.getAttribute("data-confirm"))) event.preventDefault();
    });
  });

  // Copy a link to the clipboard.
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var url = new URL(button.getAttribute("data-copy"), window.location.origin).href;
      if (!navigator.clipboard) { window.prompt("Copy this link:", url); return; }
      navigator.clipboard.writeText(url).then(function () {
        var label = button.querySelector("[data-copy-label]");
        if (!label) return;
        var old = label.textContent;
        label.textContent = "Copied";
        setTimeout(function () { label.textContent = old; }, 1600);
      });
    });
  });

  // Close the flash message.
  document.querySelectorAll("[data-dismiss]").forEach(function (button) {
    button.addEventListener("click", function () { button.closest(".flash").remove(); });
  });

  // Review page: while the local AI is writing, check back every few seconds.
  var box = document.querySelector("[data-explanation][data-status=queued]");
  if (box) {
    var tries = 0;
    var poll = setInterval(function () {
      tries += 1;
      fetch(box.getAttribute("data-explanation"), { headers: { Accept: "application/json" } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status === "queued" && tries < 60) return;
          clearInterval(poll);
          window.location.reload();
        })
        .catch(function () { clearInterval(poll); });
    }, 3000);
  }

  // Esc closes the student drawer.
  var closeLink = document.querySelector("[data-drawer-close]");
  if (closeLink) {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") window.location.href = closeLink.getAttribute("href");
    });
  }
})();
