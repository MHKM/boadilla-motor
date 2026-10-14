"use strict";

// Suite F005: sticky mobile action bar (Call / WhatsApp). Design: .factory/artifacts/F005/design.md.

(function () {
  var CALL_HREF = "tel:+34915048056";
  var WA_PREFIX = "https://wa.me/34619768932?text=";
  var WA_MESSAGE = "Hola, quería pedir cita para mi coche.";

  // ---- helpers (local to this file) ----

  function bar(p) {
    var el = byTestId(p.doc, "sticky-bar");
    assert(el, "sticky-bar missing");
    return el;
  }

  function link(p, id) {
    var el = byTestId(p.doc, id);
    assert(el, id + " missing");
    return el;
  }

  function href(p, id) {
    return link(p, id).getAttribute("href");
  }

  function scrollTo(p, y) {
    p.win.scrollTo({ top: y, left: 0, behavior: "instant" });
  }

  // The bar is visible, spans the full width and sits on the bottom edge of the viewport.
  function checkPinned(p, where) {
    var root = p.doc.documentElement;
    var el = bar(p);
    assert(isVisible(el), "sticky-bar is not visible " + where);
    var r = el.getBoundingClientRect();
    assert(r.left <= 1 && r.right >= root.clientWidth - 1,
      "sticky-bar is not full width " + where + ": " + Math.round(r.left) + ".." + Math.round(r.right));
    assert(Math.abs(r.bottom - root.clientHeight) <= 1,
      "sticky-bar bottom " + Math.round(r.bottom) + " is not the viewport bottom " + root.clientHeight + " " + where);
  }

  // ---- T012: sticky bar ----

  test("AC-F005-01 bar is visible, full width and at the bottom edge at the top of the page (375x812)", function (page) {
    var p = page.mobile;
    assertEqual(p.win.scrollY, 0, "page is not at the top");
    checkPinned(p, "at the top");
  });

  test("AC-F005-02 bar stays at the bottom edge while scrolling to the middle and to the end (375x812)", function (page) {
    var p = page.mobile;
    var root = p.doc.documentElement;
    try {
      scrollTo(p, (root.scrollHeight - root.clientHeight) / 2);
      assert(p.win.scrollY > 0, "page did not scroll to the middle");
      checkPinned(p, "at the middle");
      scrollTo(p, root.scrollHeight);
      assert(p.win.scrollY > 0, "page did not scroll to the end");
      checkPinned(p, "at the end");
    } finally {
      scrollTo(p, 0);
    }
  });

  test("AC-F005-03 call button is a tel: link with text Llamar", function (page) {
    var call = link(page.mobile, "sticky-bar-call");
    assertEqual(call.tagName, "A", "sticky-bar-call tag");
    assertEqual(text(call), "Llamar", "sticky-bar-call text");
    assertEqual(call.getAttribute("href"), CALL_HREF, "sticky-bar-call href");
  });

  test("AC-F005-04 WhatsApp button links to wa.me with the message and opens safely", function (page) {
    var wa = link(page.mobile, "sticky-bar-whatsapp");
    assertEqual(wa.tagName, "A", "sticky-bar-whatsapp tag");
    assertEqual(text(wa), "WhatsApp", "sticky-bar-whatsapp text");
    var h = wa.getAttribute("href");
    assertEqual(h.indexOf(WA_PREFIX), 0, "href prefix of " + h);
    assertEqual(new URL(h).searchParams.get("text"), WA_MESSAGE, "decoded text parameter");
    assertEqual(wa.getAttribute("target"), "_blank", "target");
    var rel = (wa.getAttribute("rel") || "").split(/\s+/);
    assert(rel.indexOf("noopener") !== -1, "rel lacks noopener: " + rel.join(" "));
  });

  test("AC-F005-05 buttons are side by side, at least 44px tall and inside the width (375px)", function (page) {
    var p = page.mobile;
    var width = p.doc.documentElement.clientWidth;
    var call = link(p, "sticky-bar-call").getBoundingClientRect();
    var wa = link(p, "sticky-bar-whatsapp").getBoundingClientRect();
    [["call", call], ["whatsapp", wa]].forEach(function (pair) {
      var r = pair[1];
      assert(r.height >= 44, pair[0] + " is " + Math.round(r.height) + "px tall, less than 44");
      assert(r.left >= -1 && r.right <= width + 1, pair[0] + " is not inside the width: " +
        Math.round(r.left) + ".." + Math.round(r.right));
    });
    assert(Math.abs(call.top - wa.top) <= 1, "buttons are not on the same row: " + call.top + " vs " + wa.top);
    assert(call.right <= wa.left + 1, "call is not to the left of WhatsApp");
  });

  test("AC-F005-06 bar links equal the hero and contact links and the contact check is clean", function (page) {
    var p = page.mobile;
    assertEqual(href(p, "sticky-bar-call"), href(p, "hero-call"), "call vs hero-call");
    assertEqual(href(p, "sticky-bar-call"), href(p, "contact-phone-main"), "call vs contact-phone-main");
    assertEqual(href(p, "sticky-bar-whatsapp"), href(p, "hero-whatsapp"), "whatsapp vs hero-whatsapp");
    assertEqual(href(p, "sticky-bar-whatsapp"), href(p, "contact-whatsapp"), "whatsapp vs contact-whatsapp");
    var problems = checkContact(p.doc, window.EXPECTED_CONTACT);
    assertEqual(problems.length, 0, "contact check: " + problems.join("; "));
  });

  test("AC-F005-07 footer is entirely above the bar at the end of the page (375x812)", function (page) {
    var p = page.mobile;
    var root = p.doc.documentElement;
    try {
      scrollTo(p, root.scrollHeight);
      var footer = byTestId(p.doc, "footer");
      assert(footer, "footer missing");
      var fb = footer.getBoundingClientRect().bottom;
      var bt = bar(p).getBoundingClientRect().top;
      assert(fb <= bt + 1, "footer bottom " + Math.round(fb) + " is below the bar top " + Math.round(bt));
    } finally {
      scrollTo(p, 0);
    }
  });

  test("AC-F005-08 bar is visible at 767px and hidden at 768px and 1280px", function (page) {
    function visibleAt(w, h) {
      return loadFrame("../index.html", w, h).then(function (p) {
        return isVisible(bar(p));
      });
    }
    return visibleAt(767, 900).then(function (v767) {
      assert(v767, "sticky-bar is not visible at 767px");
      return visibleAt(768, 900);
    }).then(function (v768) {
      assert(!v768, "sticky-bar is visible at 768px");
      assert(!isVisible(bar(page.desktop)), "sticky-bar is visible at 1280px");
    });
  });

  test("AC-F005-09 without JavaScript the bar and both links are visible with the same hrefs", function (page) {
    var p = page.nojs;
    assert(isVisible(bar(p)), "sticky-bar is not visible without JS");
    ["sticky-bar-call", "sticky-bar-whatsapp"].forEach(function (id) {
      assert(isVisible(link(p, id)), id + " is not visible without JS");
      assertEqual(href(p, id), href(page.mobile, id), id + " href differs from the JS page");
    });
  });

  test("AC-F005-10 bar has aria-label Contacto rápido and both buttons have visible text", function (page) {
    var p = page.mobile;
    assertEqual(bar(p).getAttribute("aria-label"), "Contacto rápido", "aria-label");
    [["sticky-bar-call", "Llamar"], ["sticky-bar-whatsapp", "WhatsApp"]].forEach(function (pair) {
      var t = text(link(p, pair[0]));
      assert(t.length > 0, pair[0] + " has no text");
      assertEqual(t, pair[1], pair[0] + " text");
    });
  });
})();
