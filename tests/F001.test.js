"use strict";

// Suite F001: hero with call to action, header and navigation.
// Design: .factory/artifacts/F001/design.md ("Test rules").

(function () {
  var CALL_HREF = "tel:+34915048056";
  var WA_PREFIX = "https://wa.me/34619768932?text=";
  var WA_MESSAGE = "Hola, quería pedir cita para mi coche.";

  // ---- helpers (local to this file) ----

  function visibleBottom(p) {
    var root = p.doc.documentElement;
    var bar = byTestId(p.doc, "sticky-bar");
    if (bar && isVisible(bar)) {
      return root.clientHeight - bar.getBoundingClientRect().height;
    }
    return root.clientHeight;
  }

  function insideWidth(p, el) {
    var rect = el.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= p.doc.documentElement.clientWidth + 1;
  }

  function fullyInView(p, el) {
    var rect = el.getBoundingClientRect();
    return rect.top >= -1 && rect.bottom <= visibleBottom(p) + 1 && insideWidth(p, el);
  }

  function snapshot(p) {
    var doc = p.doc;
    return ["hero-title", "hero-subtitle", "hero-call", "hero-whatsapp"].map(function (id) {
      var el = byTestId(doc, id);
      return id + "|" + text(el) + "|" + (el ? el.getAttribute("href") : "");
    });
  }

  // ---- T005: hero ----

  test("AC-F001-01 hero title is the only h1 with the exact text", function (page) {
    var doc = page.mobile.doc;
    var title = byTestId(doc, "hero-title");
    assert(title, "hero-title missing");
    assertEqual(title.tagName, "H1", "hero-title tag");
    assertEqual(text(title), "Tu taller de confianza en Boadilla del Monte", "hero-title text");
    assertEqual(doc.querySelectorAll("h1").length, 1, "number of h1 in the page");
  });

  test("AC-F001-02 hero subtitle names the four brands and multimarca", function (page) {
    var sub = byTestId(page.mobile.doc, "hero-subtitle");
    assert(sub, "hero-subtitle missing");
    assert(isVisible(sub), "hero-subtitle is not visible");
    var t = text(sub);
    assert(t.length >= 40 && t.length <= 200, "subtitle length " + t.length + " is not 40-200");
    ["Audi", "Seat", "Volkswagen", "Skoda", "multimarca"].forEach(function (word) {
      assert(t.indexOf(word) !== -1, "subtitle lacks " + word);
    });
  });

  test("AC-F001-03 call button is a tel: link to the main phone", function (page) {
    var call = byTestId(page.mobile.doc, "hero-call");
    assert(call, "hero-call missing");
    assertEqual(call.tagName, "A", "hero-call tag");
    assertEqual(text(call), "Llamar ahora", "hero-call text");
    assertEqual(call.getAttribute("href"), CALL_HREF, "hero-call href");
  });

  test("AC-F001-04 WhatsApp button links to wa.me with the message and opens safely", function (page) {
    var wa = byTestId(page.mobile.doc, "hero-whatsapp");
    assert(wa, "hero-whatsapp missing");
    assertEqual(wa.tagName, "A", "hero-whatsapp tag");
    assertEqual(text(wa), "Escribir por WhatsApp", "hero-whatsapp text");
    var href = wa.getAttribute("href");
    assertEqual(href.indexOf(WA_PREFIX), 0, "href prefix of " + href);
    assertEqual(new URL(href).searchParams.get("text"), WA_MESSAGE, "decoded text parameter");
    assertEqual(wa.getAttribute("target"), "_blank", "target");
    var rel = (wa.getAttribute("rel") || "").split(/\s+/);
    assert(rel.indexOf("noopener") !== -1, "rel lacks noopener: " + rel.join(" "));
  });

  test("AC-F001-05 title and both buttons are fully in view without scrolling", function (page) {
    [page.mobile, page.desktop].forEach(function (p) {
      var width = p.doc.documentElement.clientWidth;
      assertEqual(p.win.scrollY, 0, "page is not at the top (" + width + "px frame)");
      ["hero-title", "hero-call", "hero-whatsapp"].forEach(function (id) {
        var el = byTestId(p.doc, id);
        assert(el, id + " missing");
        var r = el.getBoundingClientRect();
        assert(fullyInView(p, el), id + " is cut at " + width + "px: top " + Math.round(r.top) +
          " bottom " + Math.round(r.bottom) + " of " + visibleBottom(p));
      });
    });
  });

  test("AC-F001-06 buttons are at least 44px tall and inside the width at 375px", function (page) {
    var p = page.mobile;
    ["hero-call", "hero-whatsapp"].forEach(function (id) {
      var el = byTestId(p.doc, id);
      assert(el, id + " missing");
      var h = el.getBoundingClientRect().height;
      assert(h >= 44, id + " height " + h + " < 44");
      assert(insideWidth(p, el), id + " is outside the screen width");
    });
    var root = p.doc.documentElement;
    assert(root.scrollWidth <= root.clientWidth, "page has horizontal scroll: " + root.scrollWidth + " > " + root.clientWidth);
  });

  test("AC-F001-10 hero is present and identical without JavaScript", function (page) {
    ["hero-title", "hero-subtitle", "hero-call", "hero-whatsapp"].forEach(function (id) {
      assert(isVisible(byTestId(page.nojs.doc, id)), id + " is not visible without JavaScript");
    });
    var a = snapshot(page.nojs);
    var b = snapshot(page.mobile);
    assertEqual(a.join("\n"), b.join("\n"), "texts and links without JavaScript");
  });

  test("AC-F001-11 hero has no form controls, images or background image", function (page) {
    var hero = byTestId(page.mobile.doc, "hero");
    assert(hero, "hero missing");
    var forbidden = hero.querySelectorAll("form, input, button, img, picture, iframe, object, embed, video");
    assertEqual(forbidden.length, 0, "forbidden elements in the hero");
    var bg = page.mobile.win.getComputedStyle(hero).backgroundImage;
    assertEqual(bg, "none", "hero background-image");
  });
})();
