(function () {
  "use strict";

  var MINIMUM_PRICE = 150;
  var MAX_FEET = 10000;

  var SERVICES = {
    house:    { label: "House washing",    rate: 0.15, unit: "sq ft",     type: "area" },
    driveway: { label: "Driveway washing", rate: 0.12, unit: "sq ft",     type: "area" },
    deck:     { label: "Deck washing",     rate: 0.30, unit: "sq ft",     type: "area" },
    fence:    { label: "Fence washing",    rate: 1.00, unit: "linear ft", type: "linear" }
  };

  var form = document.getElementById("quote-form");
  var submitBtn = document.getElementById("submit-btn");
  var statusBox = document.getElementById("status");
  var areaFields = document.getElementById("area-fields");
  var fenceFields = document.getElementById("fence-fields");
  var hint = document.getElementById("measure-hint");
  var inputs = {
    length: document.getElementById("length"),
    width: document.getElementById("width"),
    linear: document.getElementById("linear"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    company: document.getElementById("company")
  };
  var touched = {};

  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  var number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

  document.getElementById("year").textContent = new Date().getFullYear();

  function selectedServiceKey() {
    return form.querySelector('input[name="service"]:checked').value;
  }

  // Returns a positive number, or null if the value is missing or invalid.
  function readFeet(input) {
    var raw = input.value.trim();
    if (raw === "") return null;
    var value = Number(raw);
    if (!isFinite(value) || value <= 0 || value > MAX_FEET) return null;
    return value;
  }

  function measurementError(input) {
    var raw = input.value.trim();
    if (raw === "") return "Please enter a measurement.";
    var value = Number(raw);
    if (!isFinite(value)) return "Please enter a valid number.";
    if (value <= 0) return "Measurement must be greater than 0.";
    if (value > MAX_FEET) return "Please enter a value under " + number.format(MAX_FEET) + " feet.";
    return "";
  }

  // Core pricing logic: size x rate, never below the minimum.
  function calculate() {
    var service = SERVICES[selectedServiceKey()];
    var size = null;
    var description = "";

    if (service.type === "area") {
      var length = readFeet(inputs.length);
      var width = readFeet(inputs.width);
      if (length !== null && width !== null) {
        size = length * width;
        description = number.format(length) + " ft × " + number.format(width) + " ft = " +
          number.format(size) + " sq ft";
      }
    } else {
      var linear = readFeet(inputs.linear);
      if (linear !== null) {
        size = linear;
        description = number.format(linear) + " linear ft";
      }
    }

    var subtotal = size === null ? null : Math.round(size * service.rate * 100) / 100;
    var total = subtotal === null ? MINIMUM_PRICE : Math.max(MINIMUM_PRICE, subtotal);

    return {
      service: service,
      size: size,
      description: description,
      subtotal: subtotal,
      total: total,
      minimumApplied: subtotal === null || subtotal < MINIMUM_PRICE
    };
  }

  function updateEstimate() {
    var q = calculate();
    document.getElementById("estimate-price").textContent = money.format(q.total);
    document.getElementById("summary-price").textContent = money.format(q.total);
    document.getElementById("bd-service").textContent = q.service.label;
    document.getElementById("bd-size-label").textContent = q.service.type === "area" ? "Area" : "Length";
    document.getElementById("bd-size").textContent =
      q.size === null ? "—" : number.format(q.size) + " " + q.service.unit;
    document.getElementById("bd-rate").textContent = money.format(q.service.rate) + " / " + q.service.unit;
    document.getElementById("bd-subtotal").textContent = q.subtotal === null ? "—" : money.format(q.subtotal);

    var note = document.getElementById("minimum-note");
    if (q.size === null) {
      note.textContent = "Enter your measurements to see your price. Minimum job price is $150.";
    } else if (q.minimumApplied) {
      note.textContent = "Your job is below our $150 minimum, so the minimum price applies.";
    } else {
      note.textContent = "Minimum job price is $150.";
    }
  }

  function updateServiceFields() {
    var isFence = SERVICES[selectedServiceKey()].type === "linear";
    areaFields.hidden = isFence;
    fenceFields.hidden = !isFence;
    hint.textContent = isFence
      ? "Add up the length of every section of fence you'd like washed."
      : "Measure the length and width of the surface. We'll calculate the area for you.";
    // Clear errors for fields that are now hidden
    ["length", "width", "linear"].forEach(function (k) { if (!touched[k]) setError(k, ""); });
  }

  function setError(key, message) {
    var el = document.getElementById(key + "-error");
    if (el) el.textContent = message;
    inputs[key].setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(key) {
    var input = inputs[key];
    var value = input.value.trim();
    var message = "";

    if (key === "length" || key === "width" || key === "linear") {
      message = measurementError(input);
    } else if (key === "name") {
      if (value.length < 2) message = "Please enter your full name.";
    } else if (key === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) message = "Please enter a valid email address.";
    } else if (key === "phone") {
      var digits = value.replace(/\D/g, "");
      if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
      if (digits.length !== 10) message = "Please enter a 10-digit US phone number.";
    }

    setError(key, message);
    return message === "";
  }

  function fieldsToValidate() {
    var measureKeys = SERVICES[selectedServiceKey()].type === "area" ? ["length", "width"] : ["linear"];
    return measureKeys.concat(["name", "email", "phone"]);
  }

  function showStatus(type, html) {
    statusBox.className = "status status-" + type;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
    statusBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function isConfigured() {
    var c = window.EMAIL_CONFIG || {};
    return window.emailjs && c.publicKey && c.serviceId && c.templateId &&
      c.publicKey.indexOf("YOUR_") !== 0 && c.serviceId.indexOf("YOUR_") !== 0 && c.templateId.indexOf("YOUR_") !== 0;
  }

  // ---- Events ----

  form.addEventListener("change", function (e) {
    if (e.target.name === "service") {
      updateServiceFields();
      updateEstimate();
    }
  });

  ["length", "width", "linear"].forEach(function (key) {
    var input = inputs[key];
    // Block characters that would allow negative or scientific-notation values
    input.addEventListener("keydown", function (e) {
      if (["-", "+", "e", "E"].indexOf(e.key) !== -1) e.preventDefault();
    });
    input.addEventListener("input", function () {
      if (touched[key]) validateField(key);
      updateEstimate();
    });
  });

  Object.keys(inputs).forEach(function (key) {
    if (key === "company") return;
    inputs[key].addEventListener("blur", function () {
      if (inputs[key].value.trim() !== "") touched[key] = true;
      if (touched[key]) validateField(key);
    });
    inputs[key].addEventListener("input", function () {
      if (touched[key]) validateField(key);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusBox.hidden = true;

    var keys = fieldsToValidate();
    var firstInvalid = null;
    keys.forEach(function (key) {
      touched[key] = true;
      if (!validateField(key) && !firstInvalid) firstInvalid = inputs[key];
    });
    if (firstInvalid) {
      showStatus("error", "Please fix the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }

    // Spam trap filled in: silently stop (no email, no success message)
    if (inputs.company.value) return;

    if (!isConfigured()) {
      showStatus("error",
        "<strong>Sorry, we couldn't send your request.</strong> Online submissions aren't set up yet. " +
        "Please call or email us directly, and we'll be happy to help.");
      return;
    }

    var q = calculate();
    var params = {
      customer_name: inputs.name.value.trim(),
      customer_email: inputs.email.value.trim(),
      customer_phone: inputs.phone.value.trim(),
      service: q.service.label,
      measurements: q.description,
      rate: money.format(q.service.rate) + " / " + q.service.unit,
      estimate: money.format(q.total),
      minimum_applied: q.minimumApplied ? "Yes ($150 minimum applied)" : "No",
      submitted_at: new Date().toLocaleString("en-US")
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var c = window.EMAIL_CONFIG;
    window.emailjs.send(c.serviceId, c.templateId, params, { publicKey: c.publicKey })
      .then(function () {
        // Only reached when EmailJS confirms the email was sent
        showStatus("success",
          "<strong>Thank you, " + escapeHtml(params.customer_name) + "!</strong> Your estimate request (" +
          params.estimate + ") has been sent. We'll contact you within one business day.");
        form.reset();
        touched = {};
        updateServiceFields();
        updateEstimate();
      })
      .catch(function (err) {
        console.error("Email send failed:", err);
        showStatus("error",
          "<strong>Sorry, your request didn't go through.</strong> Please check your internet connection " +
          "and try again in a moment. If the problem continues, please contact us by phone.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send my estimate request";
      });
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  updateServiceFields();
  updateEstimate();
})();
