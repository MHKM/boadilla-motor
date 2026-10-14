"use strict";

// Suite F004: contact section and footer. Design: .factory/artifacts/F004/design.md.

(function () {
  var C = window.EXPECTED_CONTACT;
  var WA_HREF = "https://wa.me/" + C.whatsapp.number + "?text=" + encodeURIComponent(C.whatsapp.message);

  function phone(id) {
    return C.phones.filter(function (p) { return p.id === id; })[0];
  }

  function rel(el) {
    return (el.getAttribute("rel") || "").split(/\s+/);
  }

  function insideWidth(doc, el) {
    var r = el.getBoundingClientRect();
    var w = doc.documentElement.clientWidth;
    return r.left >= -1 && r.right <= w + 1;
  }

  // ---- T009: title, phones, WhatsApp and email ----

  test("AC-F004-01 contact section has an h2 title Contacto inside #contacto", function (page) {
    var doc = page.mobile.doc;
    var title = byTestId(doc, "contact-title");
    assert(title, "contact-title missing");
    assertEqual(title.tagName, "H2", "title tag");
    assert(title.closest("#contacto"), "title is not inside #contacto");
    assertEqual(text(title), "Contacto", "title text");
  });

  [["main", "contact-phone-main"], ["mobile", "contact-phone-mobile"]].forEach(function (pair) {
    test("AC-F004-02 " + pair[0] + " phone is a tel: link with the exact number", function (page) {
      var el = byTestId(page.mobile.doc, pair[1]);
      assert(el, pair[1] + " missing");
      assertEqual(el.tagName, "A", "tag");
      assertEqual(text(el), phone(pair[0]).display, "text");
      assertEqual(el.getAttribute("href"), "tel:" + phone(pair[0]).tel, "href");
    });
  });

  test("AC-F004-03 WhatsApp button has the label, number, message and noopener", function (page) {
    var el = byTestId(page.mobile.doc, "contact-whatsapp");
    assert(el, "contact-whatsapp missing");
    assertEqual(el.tagName, "A", "tag");
    assertEqual(text(el), "Escribir por WhatsApp", "text");
    var href = el.getAttribute("href");
    assertEqual(href.indexOf("https://wa.me/" + C.whatsapp.number + "?"), 0, "href prefix");
    assertEqual(new URL(href).searchParams.get("text"), C.whatsapp.message, "decoded message");
    assertEqual(href, WA_HREF, "href");
    assertEqual(el.getAttribute("target"), "_blank", "target");
    assert(rel(el).indexOf("noopener") !== -1, "rel must contain noopener");
  });

  test("AC-F004-07 email is a mailto: link with the exact address", function (page) {
    var el = byTestId(page.mobile.doc, "contact-email");
    assert(el, "contact-email missing");
    assertEqual(el.tagName, "A", "tag");
    assertEqual(text(el), C.email, "text");
    assertEqual(el.getAttribute("href"), "mailto:" + C.email, "href");
  });

  test("AC-F004-13 phone, WhatsApp and email links are tappable at 375px", function (page) {
    var doc = page.mobile.doc;
    ["contact-phone-main", "contact-phone-mobile", "contact-whatsapp", "contact-email"].forEach(function (id) {
      var el = byTestId(doc, id);
      assert(el, id + " missing");
      var r = el.getBoundingClientRect();
      assert(r.height >= 44 - 1, id + " height " + r.height + " < 44");
      assert(insideWidth(doc, el), id + " outside the screen width");
    });
    assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth, "horizontal scroll at 375px");
  });

  // ---- T010: address, map link, hours and ZBE notice ----

  test("AC-F004-04 address is inside an address element with the exact text", function (page) {
    var el = byTestId(page.mobile.doc, "contact-address");
    assert(el, "contact-address missing");
    assert(el.closest("address"), "contact-address is not inside <address>");
    assertEqual(text(el), C.address, "address text");
  });

  test("AC-F004-05 map link opens Google Maps in a new tab and there is no iframe", function (page) {
    var doc = page.mobile.doc;
    var el = byTestId(doc, "contact-map");
    assert(el, "contact-map missing");
    assertEqual(el.tagName, "A", "tag");
    assertEqual(text(el), "Cómo llegar", "text");
    assertEqual(el.getAttribute("href"), C.mapUrl, "href");
    assertEqual(el.getAttribute("target"), "_blank", "target");
    assert(rel(el).indexOf("noopener") !== -1, "rel must contain noopener");
    assertEqual(doc.querySelectorAll("iframe").length, 0, "number of iframes");
  });

  test("AC-F004-06 hours are two lines, in order, each on its own row", function (page) {
    var doc = page.mobile.doc;
    var box = byTestId(doc, "contact-hours");
    assert(box, "contact-hours missing");
    var lines = allByTestId(doc, "contact-hours-line");
    assertEqual(lines.length, 2, "number of hour lines");
    lines.forEach(function (li, i) {
      assert(box.contains(li), "line " + i + " is outside contact-hours");
      assertEqual(text(li), C.hours[i], "text of line " + i);
    });
    var first = lines[0].getBoundingClientRect();
    var second = lines[1].getBoundingClientRect();
    assert(second.top >= first.bottom - 1, "second line is not below the first");
  });

  test("AC-F004-08 ZBE notice is visible and mentions the sticker and calling first", function (page) {
    var el = byTestId(page.mobile.doc, "contact-zbe");
    assert(el, "contact-zbe missing");
    assert(isVisible(el), "contact-zbe not visible");
    var t = text(el).toLowerCase();
    assert(t.indexOf("zona de bajas emisiones") !== -1, "missing 'Zona de Bajas Emisiones'");
    assert(t.indexOf("etiqueta ambiental") !== -1, "missing 'etiqueta ambiental'");
    assert(t.indexOf("llámanos") !== -1, "missing 'llámanos'");
  });

  test("AC-F004-13 map link is tappable at 375px", function (page) {
    var doc = page.mobile.doc;
    var el = byTestId(doc, "contact-map");
    assert(el, "contact-map missing");
    var r = el.getBoundingClientRect();
    assert(r.height >= 44 - 1, "contact-map height " + r.height + " < 44");
    assert(insideWidth(doc, el), "contact-map outside the screen width");
    assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth, "horizontal scroll at 375px");
  });
})();
