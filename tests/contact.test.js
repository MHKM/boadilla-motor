"use strict";

// Suite "contact" (T004): contact data in index.html must agree with EXPECTED_CONTACT.
// The checker runs on the live page (static markup and with scripts) and on fixture snippets.

(function () {
  var E = window.EXPECTED_CONTACT;

  function escAttr(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function parse(html) {
    return new DOMParser().parseFromString("<!doctype html><html><body>" + html + "</body></html>", "text/html");
  }

  function waHref(number, message) {
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  // A snippet that is consistent with EXPECTED_CONTACT in every rule. Tests alter one part of it.
  function snippet(overrides) {
    var o = overrides || {};
    function pick(name, fallback) {
      return o.hasOwnProperty(name) ? o[name] : fallback;
    }
    return [
      '<p><a data-testid="contact-call" href="' + escAttr(pick("tel1", "tel:" + E.phones[0].tel)) + '">' +
        pick("tel1Text", E.phones[0].display) + "</a></p>",
      '<p><a data-testid="sticky-bar-call" href="tel:' + E.phones[1].tel + '">Llamar</a></p>',
      '<p data-testid="contact-note">' + pick("plain", "Llámanos al " + E.phones[0].display + " o al " + E.phones[1].display + ".") + "</p>",
      '<a data-testid="contact-whatsapp" href="' + escAttr(pick("wa", waHref(E.whatsapp.number, E.whatsapp.message))) + '">WhatsApp</a>',
      '<p data-testid="contact-address">' + pick("address", E.address) + "</p>",
      '<p data-testid="contact-hours">' + pick("hours", E.hours.join("<br>")) + "</p>",
      '<a data-testid="contact-map" href="' + escAttr(pick("map", E.mapUrl)) + '" target="_blank" ' + pick("mapRel", 'rel="noopener"') + ">Cómo llegar</a>",
      '<a data-testid="contact-reviews" href="' + escAttr(pick("reviews", E.reviewsUrl)) + '" target="_blank" rel="noopener">Opiniones</a>',
      pick("extra", ""),
      '<a href="' + escAttr(pick("mailto", "mailto:" + E.email)) + '">' + E.email + "</a>"
    ].join("\n");
  }

  function expectErrors(html, label) {
    var errors = window.checkContact(parse(html), E);
    assert(errors.length >= 1, label + ": expected at least one error, got none");
    errors.forEach(function (e) {
      assertEqual(typeof e, "string", "each error is a string");
    });
    return errors;
  }

  function readText(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onload = function () { resolve(xhr.responseText); };
      xhr.onerror = function () { reject(new Error("cannot read " + url)); };
      xhr.send();
    });
  }

  test("T004 expected contact data has the documented shape and values", function () {
    assert(E, "window.EXPECTED_CONTACT is not defined");
    assertEqual(E.phones.length, 2, "phones count");
    assertEqual(E.phones[0].id, "main", "phone 0 id");
    assertEqual(E.phones[0].display, "915 04 80 56", "main display");
    assertEqual(E.phones[0].tel, "+34915048056", "main tel");
    assertEqual(E.phones[1].id, "mobile", "phone 1 id");
    assertEqual(E.phones[1].display, "619 76 89 32", "mobile display");
    assertEqual(E.phones[1].tel, "+34619768932", "mobile tel");
    assertEqual(E.whatsapp.number, "34619768932", "whatsapp number");
    assertEqual(typeof E.whatsapp.message, "string", "whatsapp message");
    assertEqual(E.address, "C. Juan Carlos I, 3, 28660 Boadilla del Monte", "address");
    assertMatch(E.mapUrl, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Boadilla%20Motor%20Sport/, "mapUrl");
    assertMatch(E.reviewsUrl, /^https:\/\/www\.google\.com\/maps\//, "reviewsUrl");
    assertEqual(E.email, "info@boadillamotor.es", "email");
    assertEqual(E.hours.length, 2, "hours lines");
  });

  test("T004 checkContact reports no mismatch on the static page (no scripts)", function (page) {
    assertEqual(typeof window.checkContact, "function", "window.checkContact");
    var errors = window.checkContact(page.nojs.doc, E);
    assertEqual(errors.join(" | "), "", "static page mismatches");
  });

  test("T004 checkContact reports no mismatch on the live page", function (page) {
    var errors = window.checkContact(page.mobile.doc, E);
    assertEqual(errors.join(" | "), "", "live page mismatches");
  });

  test("T004 checkContact accepts a consistent snippet", function () {
    assertEqual(window.checkContact(parse(snippet()), E).join(" | "), "", "consistent snippet");
  });

  test("T004 checkContact accepts an empty document", function () {
    assertEqual(window.checkContact(parse(""), E).length, 0, "empty document");
  });

  test("T004 checkContact has no side effects on the document", function () {
    var doc = parse(snippet());
    var before = doc.documentElement.outerHTML;
    window.checkContact(doc, E);
    assertEqual(doc.documentElement.outerHTML, before, "document html");
  });

  test("T004 rule 1 flags a tel link to an unknown number", function () {
    var errors = expectErrors(snippet({ tel1: "tel:+34911111111" }), "wrong tel href");
    assert(errors.join(" ").indexOf("tel:+34911111111") !== -1, "error should mention the offending href: " + errors.join(" | "));
  });

  test("T004 rule 1 flags a tel link whose text is another phone", function () {
    expectErrors(snippet({ tel1Text: E.phones[1].display }), "text does not match href");
  });

  test("T004 rule 1 accepts a tel link with text without digits", function () {
    assertEqual(window.checkContact(parse(snippet({ tel1Text: "Llamar ahora" })), E).length, 0, "text without digits");
  });

  test("T004 rule 2 flags a stale phone in plain text", function () {
    var errors = expectErrors(snippet({ plain: "Llámanos al 916 11 22 33." }), "stale phone");
    assert(errors.join(" ").indexOf("916 11 22 33") !== -1, "error should mention the stale phone: " + errors.join(" | "));
  });

  test("T004 rule 3 flags a wa.me link with another number", function () {
    expectErrors(snippet({ wa: waHref("34600000000", E.whatsapp.message) }), "other wa.me number");
  });

  test("T004 rule 3 flags a wa.me link with an unencoded message", function () {
    expectErrors(snippet({ wa: "https://wa.me/" + E.whatsapp.number + "?text=" + E.whatsapp.message }), "unencoded message");
  });

  test("T004 rule 3 flags a wa.me link without message", function () {
    expectErrors(snippet({ wa: "https://wa.me/" + E.whatsapp.number }), "no text parameter");
  });

  test("T004 rule 4 flags a different address", function () {
    expectErrors(snippet({ address: "C. Mayor, 1, 28660 Boadilla del Monte" }), "other address");
  });

  test("T004 rule 5 flags a missing hours line", function () {
    expectErrors(snippet({ hours: E.hours[0] }), "missing second hours line");
  });

  test("T004 rule 5 flags hours lines in the wrong order", function () {
    expectErrors(snippet({ hours: E.hours.slice().reverse().join("<br>") }), "reversed hours");
  });

  test("T004 rule 6 flags a wrong map href", function () {
    expectErrors(snippet({ map: "https://www.google.com/maps/search/?api=1&query=otro" }), "wrong map href");
  });

  test("T004 rule 6 flags a wrong reviews href", function () {
    expectErrors(snippet({ reviews: "https://www.google.com/maps/search/?api=1&query=otro" }), "wrong reviews href");
  });

  test("T004 rule 6 flags a google link without rel noopener", function () {
    expectErrors(snippet({ mapRel: "" }), "missing rel");
  });

  test("T004 rule 6 flags a google link that is neither map nor reviews", function () {
    expectErrors(snippet({ extra: '<a href="https://www.google.com/search?q=taller" target="_blank" rel="noopener">Buscar</a>' }), "unknown google link");
  });

  test("T004 rule 7 flags a wrong mailto", function () {
    expectErrors(snippet({ mailto: "mailto:otro@boadillamotor.es" }), "wrong mailto");
  });

  test("T004 contact-data.js and contact-check.js are never referenced by index.html", function () {
    return readText("../index.html").then(function (html) {
      assert(html.indexOf("contact-data") === -1, "index.html references contact-data");
      assert(html.indexOf("contact-check") === -1, "index.html references contact-check");
      assert(html.indexOf("EXPECTED_CONTACT") === -1, "index.html references EXPECTED_CONTACT");
    });
  });
})();
