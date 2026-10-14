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

  // ---- T006: header and navigation ----

  var NAV = [
    { text: "Servicios", href: "#servicios" },
    { text: "Por qué nosotros", href: "#por-que-nosotros" },
    { text: "Contacto", href: "#contacto" }
  ];

  // Own frame (never the shared page.*) with a tall spacer so the page can scroll
  // even while the other sections are short. Call p.cleanup() in a finally.
  function scrollableFrame(w, h) {
    return loadFrame("../index.html", w, h).then(function (p) {
      var spacer = p.doc.createElement("div");
      spacer.setAttribute("data-testid", "test-spacer");
      spacer.style.height = "3000px";
      p.doc.querySelector("main").appendChild(spacer);
      p.cleanup = function () {
        if (spacer.parentNode) {
          spacer.parentNode.removeChild(spacer);
        }
        p.win.scrollTo({ top: 0, left: 0, behavior: "instant" });
      };
      return p;
    });
  }

  function scrollTop(p, y) {
    p.win.scrollTo({ top: y, left: 0, behavior: "instant" });
  }

  function headerLinks(doc) {
    return allByTestId(doc, "header-nav-link");
  }

  function headerSnapshot(p) {
    var doc = p.doc;
    var logo = byTestId(doc, "header-logo");
    return [logo ? logo.getAttribute("href") : "", logo ? (logo.querySelector("img") || {}).alt : ""]
      .concat(headerLinks(doc).map(function (a) { return text(a) + "|" + a.getAttribute("href"); }));
  }

  test("AC-F001-07 header logo links to #inicio and has the brand alt text", function (page) {
    var logo = byTestId(page.mobile.doc, "header-logo");
    assert(logo, "header-logo missing");
    assertEqual(logo.tagName, "A", "header-logo tag");
    assertEqual(logo.getAttribute("href"), "#inicio", "header-logo href");
    var img = logo.querySelector("img");
    assert(img, "header-logo has no img");
    assertEqual(img.getAttribute("alt"), "Boadilla Motor Sport", "logo alt");
  });

  test("AC-F001-08 three navigation links in order, pointing to existing sections", function (page) {
    var doc = page.mobile.doc;
    var links = headerLinks(doc);
    assertEqual(links.length, 3, "number of header-nav-link");
    links.forEach(function (a, i) {
      assertEqual(text(a), NAV[i].text, "text of link " + (i + 1));
      assertEqual(a.getAttribute("href"), NAV[i].href, "href of link " + (i + 1));
      assert(doc.getElementById(NAV[i].href.slice(1)), "target " + NAV[i].href + " does not exist");
    });
  });

  test("AC-F001-09 logo and links are visible, tall enough and inside the width at 375px and 1280px", function (page) {
    [page.mobile, page.desktop].forEach(function (p) {
      var width = p.doc.documentElement.clientWidth;
      var logo = byTestId(p.doc, "header-logo");
      assert(isVisible(logo), "logo is not visible at " + width + "px");
      assert(insideWidth(p, logo), "logo is cut off at " + width + "px");
      var links = headerLinks(p.doc);
      assertEqual(links.length, 3, "visible links at " + width + "px");
      links.forEach(function (a) {
        assert(isVisible(a), text(a) + " is not visible at " + width + "px");
        assert(a.getBoundingClientRect().height >= 44, text(a) + " is shorter than 44px at " + width + "px");
        assert(insideWidth(p, a), text(a) + " is cut off at " + width + "px");
      });
      assertEqual(byTestId(p.doc, "header").querySelectorAll("button").length, 0, "buttons (hidden menu) in the header");
    });
  });

  test("AC-F001-10 header is present and identical without JavaScript", function (page) {
    var header = byTestId(page.nojs.doc, "header");
    assert(isVisible(header), "header is not visible without JavaScript");
    assert(isVisible(byTestId(page.nojs.doc, "header-logo")), "logo is not visible without JavaScript");
    headerLinks(page.nojs.doc).forEach(function (a) {
      assert(isVisible(a), text(a) + " is not visible without JavaScript");
    });
    assertEqual(headerSnapshot(page.nojs).join("\n"), headerSnapshot(page.mobile).join("\n"), "header without JavaScript");
  });

  test("T006 header is not sticky below 768px", function () {
    function check(w, h) {
      return scrollableFrame(w, h).then(function (p) {
        try {
          scrollTop(p, 600);
          var header = byTestId(p.doc, "header");
          var position = p.win.getComputedStyle(header).position;
          assert(position !== "sticky" && position !== "fixed", "header position is " + position + " at " + w + "px");
          var bottom = header.getBoundingClientRect().bottom;
          assert(bottom <= 1, "header is still on screen at " + w + "px: bottom " + bottom);
        } finally {
          p.cleanup();
        }
      });
    }
    return check(375, 812).then(function () { return check(767, 900); });
  });

  test("T006 header is sticky from 768px", function () {
    function check(w, h) {
      return scrollableFrame(w, h).then(function (p) {
        try {
          scrollTop(p, 600);
          var header = byTestId(p.doc, "header");
          assertEqual(p.win.getComputedStyle(header).position, "sticky", "header position at " + w + "px");
          var rect = header.getBoundingClientRect();
          assert(Math.abs(rect.top) <= 1, "header top is " + rect.top + " at " + w + "px");
          assert(isVisible(byTestId(p.doc, "header-logo")), "logo is not visible at " + w + "px");
          var links = headerLinks(p.doc);
          assertEqual(links.length, 3, "links at " + w + "px");
          links.forEach(function (a) {
            assert(isVisible(a), text(a) + " is not visible at " + w + "px");
            var r = a.getBoundingClientRect();
            var hit = p.doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            assert(hit === a || a.contains(hit), text(a) + " is covered by another element at " + w + "px");
          });
        } finally {
          p.cleanup();
        }
      });
    }
    return check(768, 900).then(function () { return check(1280, 900); });
  });

  test("T006 nav anchors are not hidden under the sticky header", function () {
    return scrollableFrame(1280, 900).then(function (p) {
      try {
        var header = byTestId(p.doc, "header");
        var root = p.doc.documentElement;
        var targets = NAV.map(function (n) { return n.href.slice(1); }).concat(["contenido"]);
        targets.forEach(function (id) {
          var target = p.doc.getElementById(id);
          assert(target, "target #" + id + " missing");
          target.scrollIntoView({ block: "start", behavior: "instant" });
          var top = target.getBoundingClientRect().top;
          var bottom = header.getBoundingClientRect().bottom;
          assert(top >= bottom - 1, "#" + id + " is under the header: top " + top + " < header bottom " + bottom);
          var maxScroll = root.scrollHeight - root.clientHeight;
          if (p.win.scrollY < maxScroll - 1) {
            assert(top <= bottom + 17, "#" + id + " lands too low: top " + top + " > header bottom " + bottom + " + 16");
          }
        });
      } finally {
        p.cleanup();
      }
    });
  });

  test("T006 nav anchors land at the top below 768px", function () {
    return scrollableFrame(375, 812).then(function (p) {
      try {
        NAV.map(function (n) { return n.href.slice(1); }).concat(["contenido"]).forEach(function (id) {
          var target = p.doc.getElementById(id);
          assert(target, "target #" + id + " missing");
          target.scrollIntoView({ block: "start", behavior: "instant" });
          var top = target.getBoundingClientRect().top;
          assert(Math.abs(top) <= 1, "#" + id + " top is " + top + " instead of 0");
        });
      } finally {
        p.cleanup();
      }
    });
  });
})();
