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
})();
