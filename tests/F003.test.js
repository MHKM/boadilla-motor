"use strict";

// Suite F003: why choose us (title, five reasons, brands strip, reviews link).
// Design: .factory/artifacts/F003/design.md.

(function () {
  var REASON_TITLES = [
    "Especialistas en tu marca",
    "Técnicos formados y equipos al día",
    "Recambios de calidad",
    "Trabajo garantizado",
    "Claridad y precios justos"
  ];

  // ---- helpers (local to this file) ----

  function reasons(p) {
    return allByTestId(p.doc, "why-us-reason");
  }

  // ---- T007: title and five reasons ----

  test("AC-F003-01 why-us title is an h2 inside #por-que-nosotros", function (page) {
    var title = byTestId(page.mobile.doc, "why-us-title");
    assert(title, "why-us-title missing");
    assertEqual(title.tagName, "H2", "why-us-title tag");
    assert(title.closest("#por-que-nosotros"), "why-us-title is not inside #por-que-nosotros");
    assertEqual(text(title), "Por qué elegir Boadilla Motor Sport", "why-us-title text");
  });

  test("AC-F003-02 five reasons with the specified titles in order", function (page) {
    var list = reasons(page.mobile);
    assertEqual(list.length, 5, "number of why-us-reason");
    list.forEach(function (reason, i) {
      var title = reason.querySelector('[data-testid="why-us-reason-title"]');
      assert(title, "reason " + (i + 1) + " has no why-us-reason-title");
      assertEqual(text(title), REASON_TITLES[i], "title of reason " + (i + 1));
    });
  });

  test("AC-F003-03 reason titles are h3 and texts are 20-160 characters", function (page) {
    var list = reasons(page.mobile);
    assertEqual(list.length, 5, "number of why-us-reason");
    list.forEach(function (reason, i) {
      var title = reason.querySelector('[data-testid="why-us-reason-title"]');
      assert(title, "reason " + (i + 1) + " has no title");
      assertEqual(title.tagName, "H3", "title tag of reason " + (i + 1));
      var body = reason.querySelector('[data-testid="why-us-reason-text"]');
      assert(body, "reason " + (i + 1) + " has no why-us-reason-text");
      var length = text(body).length;
      assert(length >= 20 && length <= 160, "text of reason " + (i + 1) + " has " + length + " characters");
    });
  });

  test("AC-F003-04 reason texts have no digits or euro sign", function (page) {
    var list = reasons(page.mobile);
    assertEqual(list.length, 5, "number of why-us-reason");
    list.forEach(function (reason, i) {
      var body = reason.querySelector('[data-testid="why-us-reason-text"]');
      assert(body, "reason " + (i + 1) + " has no why-us-reason-text");
      assert(!/[0-9€]/.test(text(body)), "reason " + (i + 1) + " has a digit or €: " + text(body));
    });
  });

  test("AC-F003-10 at 375px the reasons are stacked in one column and the page does not scroll sideways", function (page) {
    var p = page.mobile;
    var list = reasons(p);
    assertEqual(list.length, 5, "number of why-us-reason");
    var first = list[0].getBoundingClientRect();
    list.forEach(function (reason, i) {
      var rect = reason.getBoundingClientRect();
      assert(Math.abs(rect.left - first.left) <= 1, "reason " + (i + 1) + " is not in the same column: left " + rect.left + " vs " + first.left);
      if (i > 0) {
        var prev = list[i - 1].getBoundingClientRect();
        assert(rect.top >= prev.bottom - 1, "reason " + (i + 1) + " is not below reason " + i);
      }
    });
    var root = p.doc.documentElement;
    assert(root.scrollWidth <= root.clientWidth, "page has horizontal scroll: " + root.scrollWidth + " > " + root.clientWidth);
  });

  test("AC-F003-11 at 1280px the reasons use more than one column", function (page) {
    var list = reasons(page.desktop);
    assertEqual(list.length, 5, "number of why-us-reason");
    var lefts = {};
    list.forEach(function (reason) {
      lefts[Math.round(reason.getBoundingClientRect().left)] = true;
    });
    assert(Object.keys(lefts).length > 1, "all reasons share the same left edge");
  });

  // ---- T008: brands strip, reviews link and section-wide checks ----

  var BRANDS = ["Audi", "Seat", "Volkswagen", "Skoda"];
  var BRANDS_NOTE = "¿Tu coche es de otra marca? También lo atendemos.";

  function brands(p) {
    return allByTestId(p.doc, "why-us-brand");
  }

  function section(p) {
    return p.doc.getElementById("por-que-nosotros");
  }

  function sectionSnapshot(p) {
    var ids = ["why-us-title", "why-us-brands-title", "why-us-brands-note", "why-us-reviews"];
    return ids.map(function (id) { return text(byTestId(p.doc, id)); })
      .concat(reasons(p).map(function (r) { return text(r); }))
      .concat(brands(p).map(function (b) { return text(b); }));
  }

  test("AC-F003-05 brands strip shows Audi, Seat, Volkswagen and Skoda in order", function (page) {
    var strip = byTestId(page.mobile.doc, "why-us-brands");
    assert(strip, "why-us-brands missing");
    assert(isVisible(strip), "why-us-brands is not visible");
    var list = brands(page.mobile);
    assertEqual(list.length, 4, "number of why-us-brand");
    list.forEach(function (brand, i) {
      assert(strip.contains(brand), "brand " + (i + 1) + " is outside the strip");
      assertEqual(text(brand), BRANDS[i], "brand " + (i + 1));
    });
  });

  test("AC-F003-06 brands strip has no images, svg, picture or iframe", function (page) {
    var strip = byTestId(page.mobile.doc, "why-us-brands");
    assert(strip, "why-us-brands missing");
    assertEqual(strip.querySelectorAll("img, svg, picture, iframe").length, 0, "logo-like elements in the strip");
  });

  test("AC-F003-07 brands strip has an h3 title and the note about other brands", function (page) {
    var title = byTestId(page.mobile.doc, "why-us-brands-title");
    assert(title, "why-us-brands-title missing");
    assertEqual(title.tagName, "H3", "why-us-brands-title tag");
    assertEqual(text(title), "Marcas que conocemos a fondo", "why-us-brands-title text");
    var note = byTestId(page.mobile.doc, "why-us-brands-note");
    assert(note, "why-us-brands-note missing");
    assertEqual(text(note), BRANDS_NOTE, "why-us-brands-note text");
  });

  test("AC-F003-08 reviews link is a plain external link to the reviews url", function (page) {
    var link = byTestId(page.mobile.doc, "why-us-reviews");
    assert(link, "why-us-reviews missing");
    assertEqual(link.tagName, "A", "why-us-reviews tag");
    assertEqual(text(link), "Opiniones en Google", "why-us-reviews text");
    assertEqual(link.getAttribute("href"), EXPECTED_CONTACT.reviewsUrl, "why-us-reviews href");
    assertEqual(link.getAttribute("target"), "_blank", "target");
    var rel = (link.getAttribute("rel") || "").split(/\s+/);
    assert(rel.indexOf("noopener") !== -1, "rel lacks noopener: " + rel.join(" "));
  });

  test("AC-F003-09 section has no widgets, stars or review counts", function (page) {
    var el = section(page.mobile);
    assertEqual(el.querySelectorAll("iframe, script, object, embed").length, 0, "widget elements in the section");
    var content = text(el);
    assert(!/[★☆⭐]/.test(content), "star characters in the section");
    assert(!/\d+\s*(opiniones|reseñas)/i.test(content), "review count in the section");
    assert(byTestId(page.mobile.doc, "why-us-reviews"), "why-us-reviews missing");
  });

  test("AC-F003-10 at 375px the brands are inside the screen width and the page does not scroll sideways", function (page) {
    var p = page.mobile;
    var list = brands(p);
    assertEqual(list.length, 4, "number of why-us-brand");
    var width = p.doc.documentElement.clientWidth;
    list.forEach(function (brand) {
      var rect = brand.getBoundingClientRect();
      assert(rect.left >= -1 && rect.right <= width + 1, text(brand) + " is outside the width: " + rect.left + ".." + rect.right);
    });
    var root = p.doc.documentElement;
    assert(root.scrollWidth <= root.clientWidth, "page has horizontal scroll: " + root.scrollWidth + " > " + root.clientWidth);
  });

  test("AC-F003-12 without JavaScript the whole section is present with the same texts", function (page) {
    var p = page.nojs;
    ["why-us-title", "why-us-brands", "why-us-brands-note", "why-us-reviews"].forEach(function (id) {
      assert(isVisible(byTestId(p.doc, id)), id + " is not visible without JavaScript");
    });
    assertEqual(reasons(p).length, 5, "reasons without JavaScript");
    reasons(p).forEach(function (r) { assert(isVisible(r), "a reason is not visible without JavaScript"); });
    assertEqual(brands(p).length, 4, "brands without JavaScript");
    brands(p).forEach(function (b) { assert(isVisible(b), text(b) + " is not visible without JavaScript"); });
    assertEqual(sectionSnapshot(p).join("\n"), sectionSnapshot(page.mobile).join("\n"), "texts without JavaScript");
  });

  test("AC-F003-13 headings of the section are h2 first and then only h3", function (page) {
    var tags = Array.prototype.map.call(section(page.mobile).querySelectorAll("h1, h2, h3, h4, h5, h6"), function (h) { return h.tagName; });
    assert(tags.length >= 7, "only " + tags.length + " headings in the section");
    assertEqual(tags[0], "H2", "first heading");
    tags.slice(1).forEach(function (tag, i) {
      assertEqual(tag, "H3", "heading " + (i + 2));
    });
  });

  test("AC-F003-14 the reviews link passes the contact consistency check", function (page) {
    var iso = page.mobile.doc.implementation.createHTMLDocument("");
    iso.body.appendChild(iso.importNode(section(page.mobile), true));
    assert(iso.querySelector('[data-testid="why-us-reviews"]'), "reviews link missing from the section");
    var errors = checkContact(iso, EXPECTED_CONTACT);
    assertEqual(errors.join(" | "), "", "contact inconsistencies");
  });
})();
