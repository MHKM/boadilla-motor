"use strict";

// checkContact(doc, expected) -> string[]   ([] = every contact occurrence agrees with `expected`)
// Pure function: reads the document, never changes it. Rules 1-7 are described in T004.
// Markup the checker relies on: phones only as tel: links or plain text "915 04 80 56";
// WhatsApp only as wa.me links; testids ending -address, -hours, -map, -reviews; email as mailto:.

window.checkContact = function (doc, expected) {
  var errors = [];

  function collapse(value) {
    return String(value || "").replace(/[\s ]+/g, " ").trim();
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function list(selector) {
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  }

  function describe(el) {
    var id = el.getAttribute("data-testid");
    var label = id ? "[data-testid=" + id + "]" : "<" + el.tagName.toLowerCase() + ">";
    return label + " " + JSON.stringify(collapse(el.textContent).slice(0, 60));
  }

  var phones = expected.phones || [];

  // Rule 1: tel: links point to a known phone and their text (if it has digits) is that phone.
  list('a[href^="tel:"]').forEach(function (a) {
    var href = a.getAttribute("href");
    var phone = phones.filter(function (p) { return href === "tel:" + p.tel; })[0];
    if (!phone) {
      errors.push("rule 1: unknown phone in " + describe(a) + " href=" + href);
      return;
    }
    var shown = digits(a.textContent);
    if (shown !== "" && shown !== digits(phone.display)) {
      errors.push("rule 1: text of " + describe(a) + " does not match its href " + href + " (expected " + phone.display + ")");
    }
  });

  // Rule 2: every phone written as plain text is a known display number.
  var known = phones.map(function (p) { return p.display; });
  var root = doc.body || doc.documentElement;
  var walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */, null, false);
  var node;
  while ((node = walker.nextNode())) {
    var parent = node.parentNode && node.parentNode.nodeName.toLowerCase();
    if (parent === "script" || parent === "style") {
      continue;
    }
    var found = node.nodeValue.replace(/ /g, " ").match(/\b\d{3} \d{2} \d{2} \d{2}\b/g) || [];
    found.forEach(function (number) {
      if (known.indexOf(number) === -1) {
        errors.push("rule 2: unknown phone in text: " + number);
      }
    });
  }

  // Rule 3: wa.me links carry the expected number and the encoded message.
  var wa = expected.whatsapp;
  if (wa) {
    var waHref = "https://wa.me/" + wa.number + "?text=" + encodeURIComponent(wa.message);
    list('a[href*="wa.me"]').forEach(function (a) {
      if (a.getAttribute("href") !== waHref) {
        errors.push("rule 3: wa.me link " + describe(a) + " href=" + a.getAttribute("href") + " (expected " + waHref + ")");
      }
    });
  }

  // Rule 4: address elements.
  list('[data-testid$="-address"]').forEach(function (el) {
    if (collapse(el.textContent) !== expected.address) {
      errors.push("rule 4: address in " + describe(el) + " is not " + JSON.stringify(expected.address));
    }
  });

  // Rule 5: hours elements contain every expected line, in order.
  list('[data-testid$="-hours"]').forEach(function (el) {
    var content = collapse(el.textContent);
    var from = 0;
    (expected.hours || []).forEach(function (line) {
      var at = content.indexOf(collapse(line), from);
      if (at === -1) {
        errors.push("rule 5: hours in " + describe(el) + " lack (or misorder) the line " + JSON.stringify(line));
      } else {
        from = at + collapse(line).length;
      }
    });
  });

  // Rule 6: map and reviews links; every google link is one of them and opens safely.
  function checkHref(selector, url, label) {
    list(selector).forEach(function (el) {
      if (el.getAttribute("href") !== url) {
        errors.push("rule 6: " + label + " link " + describe(el) + " href=" + el.getAttribute("href") + " (expected " + url + ")");
      }
    });
  }
  checkHref('[data-testid$="-map"]', expected.mapUrl, "map");
  checkHref('[data-testid$="-reviews"]', expected.reviewsUrl, "reviews");
  list('a[href*="google."]').forEach(function (a) {
    var href = a.getAttribute("href");
    if (href !== expected.mapUrl && href !== expected.reviewsUrl) {
      errors.push("rule 6: google link " + describe(a) + " is neither the map nor the reviews url: " + href);
    }
    var rel = (a.getAttribute("rel") || "").split(/\s+/);
    if (a.getAttribute("target") !== "_blank" || rel.indexOf("noopener") === -1) {
      errors.push("rule 6: google link " + describe(a) + ' needs target="_blank" and rel containing noopener');
    }
  });

  // Rule 7: mailto links.
  list('a[href^="mailto:"]').forEach(function (a) {
    if (a.getAttribute("href") !== "mailto:" + expected.email) {
      errors.push("rule 7: mailto link " + describe(a) + " href=" + a.getAttribute("href") + " (expected mailto:" + expected.email + ")");
    }
  });

  return errors;
};
