"use strict";

// Suite F002: services carousel (title, six cards, CSS-only scroll-snap track, arrows).
// Design: .factory/artifacts/F002/design.md ("Test rules").

(function () {
  var TITLES = [
    "Mecánica rápida",
    "Mecánica general",
    "Electricidad del automóvil",
    "Preparación para la ITV",
    "Frenos: pastillas y discos",
    "Embrague y distribución"
  ];

  // ---- helpers (local to this file) ----

  function track(p) {
    return byTestId(p.doc, "services-carousel");
  }

  function items(p) {
    return allByTestId(p.doc, "services-item");
  }

  function trackBox(el) {
    var rect = el.getBoundingClientRect();
    var left = rect.left + el.clientLeft;
    return { left: left, right: left + el.clientWidth, top: rect.top };
  }

  function fullyInTrack(el, item) {
    var box = trackBox(el);
    var rect = item.getBoundingClientRect();
    return rect.left >= box.left - 1 && rect.right <= box.right + 1;
  }

  function setScroll(win, el, x) {
    el.style.scrollBehavior = "auto";
    el.scrollLeft = x;
    el.dispatchEvent(new win.Event("scroll"));
  }

  function reset(win, el) {
    setScroll(win, el, 0);
    el.style.removeProperty("scroll-behavior");
  }

  function isSingleSentence(el) {
    var raw = el.textContent.trim();
    if (/[\n\r]/.test(raw) || el.querySelector("br") !== null) {
      return "contains a line break";
    }
    if (raw.length < 20 || raw.length > 140) {
      return "length " + raw.length + " is not 20-140";
    }
    if (!/^[A-ZÁÉÍÓÚÑ¿¡][^.!?]*[.!?]$/.test(raw)) {
      return "is not a single sentence: " + raw;
    }
    return "";
  }

  function checkScrollable(p, label) {
    var el = track(p);
    assert(el, "services-carousel missing (" + label + ")");
    assert(el.scrollWidth > el.clientWidth, "track does not overflow at " + label + ": " + el.scrollWidth + " <= " + el.clientWidth);
    var style = p.win.getComputedStyle(el);
    assertMatch(style.overflowX, /^(auto|scroll)$/, "overflow-x at " + label);
    assertMatch(style.scrollSnapType, /^x/, "scroll-snap-type at " + label);
    items(p).forEach(function (item, i) {
      var align = p.win.getComputedStyle(item).scrollSnapAlign;
      assert(align && align !== "none", "scroll-snap-align of item " + (i + 1) + " at " + label + " is " + align);
    });
  }

  function itemTexts(p) {
    return items(p).map(function (item) {
      return text(item.querySelector('[data-testid="services-item-title"]')) +
        "|" + text(item.querySelector('[data-testid="services-item-text"]'));
    });
  }

  // ---- T013: title, cards, carousel without JavaScript ----

  test("AC-F002-01 services title is an h2 inside #servicios", function (page) {
    var title = byTestId(page.mobile.doc, "services-title");
    assert(title, "services-title missing");
    assertEqual(title.tagName, "H2", "services-title tag");
    assert(title.closest("#servicios"), "services-title is not inside #servicios");
    assertEqual(text(title), "Nuestros servicios", "services-title text");
  });

  test("AC-F002-02 six services in the specified order", function (page) {
    var list = items(page.mobile);
    assertEqual(list.length, 6, "number of services-item");
    list.forEach(function (item, i) {
      var title = item.querySelector('[data-testid="services-item-title"]');
      assert(title, "item " + (i + 1) + " has no services-item-title");
      assertEqual(text(title), TITLES[i], "title of item " + (i + 1));
    });
  });

  test("AC-F002-03 item titles are h3 and descriptions are single sentences", function (page) {
    assertEqual(items(page.mobile).length, 6, "number of services-item");
    items(page.mobile).forEach(function (item, i) {
      var titles = item.querySelectorAll('[data-testid="services-item-title"]');
      assertEqual(titles.length, 1, "titles in item " + (i + 1));
      assertEqual(titles[0].tagName, "H3", "title tag of item " + (i + 1));
      var texts = item.querySelectorAll('[data-testid="services-item-text"]');
      assertEqual(texts.length, 1, "texts in item " + (i + 1));
      var problem = isSingleSentence(texts[0]);
      assertEqual(problem, "", "description of item " + (i + 1));
    });
  });

  test("AC-F002-04 no prices in the item texts", function (page) {
    var list = items(page.mobile);
    assertEqual(list.length, 6, "number of services-item");
    list.forEach(function (item, i) {
      assert(!/[0-9€]|euro/i.test(text(item)), "item " + (i + 1) + " mentions a digit, € or euro: " + text(item));
    });
  });

  test("AC-F002-05 items hold no links, buttons or form controls", function (page) {
    var list = items(page.mobile);
    assertEqual(list.length, 6, "number of services-item");
    list.forEach(function (item, i) {
      assertEqual(item.querySelectorAll("a, button, input, select, textarea, form").length, 0, "interactive elements in item " + (i + 1));
    });
  });

  test("AC-F002-06 at 375px the cards sit in one row with the second one peeking", function (page) {
    var p = page.mobile;
    var el = track(p);
    assert(el, "services-carousel missing");
    var list = items(p);
    assertEqual(list.length, 6, "number of services-item");
    try {
      reset(p.win, el);
      var box = trackBox(el);
      var firstTop = list[0].getBoundingClientRect().top;
      var prevLeft = -Infinity;
      list.forEach(function (item, i) {
        assert(el.contains(item), "item " + (i + 1) + " is not inside the carousel");
        var rect = item.getBoundingClientRect();
        assert(Math.abs(rect.top - firstTop) <= 1, "item " + (i + 1) + " is on another row: top " + rect.top + " vs " + firstTop);
        assert(rect.left > prevLeft, "item " + (i + 1) + " is not to the right of the previous one");
        prevLeft = rect.left;
      });
      assert(fullyInTrack(el, list[0]), "first item is not fully visible");
      var second = list[1].getBoundingClientRect();
      assert(second.left < box.right - 1, "second item starts outside the track");
      assert(second.right > box.right + 1, "second item is not partly hidden");
      var root = p.doc.documentElement;
      assert(root.scrollWidth <= root.clientWidth, "page has horizontal scroll: " + root.scrollWidth + " > " + root.clientWidth);
    } finally {
      reset(p.win, el);
    }
  });

  test("AC-F002-07 the track scrolls sideways and snaps at 375px, 768px and 1280px", function (page) {
    checkScrollable(page.mobile, "375px");
    checkScrollable(page.desktop, "1280px");
    return loadFrame("../index.html", 768, 900).then(function (p) {
      checkScrollable(p, "768px");
    });
  });

  test("AC-F002-08 at 1280px at least three cards are fully visible in one row", function (page) {
    var p = page.desktop;
    var el = track(p);
    assert(el, "services-carousel missing");
    var list = items(p);
    assertEqual(list.length, 6, "number of services-item");
    try {
      reset(p.win, el);
      var visible = list.filter(function (item) { return fullyInTrack(el, item); });
      assert(visible.length >= 3, "only " + visible.length + " cards fully visible");
      var firstTop = list[0].getBoundingClientRect().top;
      list.forEach(function (item, i) {
        assert(Math.abs(item.getBoundingClientRect().top - firstTop) <= 1, "item " + (i + 1) + " is on a second row");
      });
      assert(!fullyInTrack(el, list[5]), "last item is already fully visible at the start");
      setScroll(p.win, el, el.scrollWidth);
      assert(fullyInTrack(el, list[5]), "last item is not fully visible at the end");
    } finally {
      reset(p.win, el);
    }
  });

  test("AC-F002-09 without JavaScript the content and the track are there and there are no arrows", function (page) {
    var p = page.nojs;
    assert(isVisible(byTestId(p.doc, "services-title")), "title is not visible without JavaScript");
    var list = items(p);
    assertEqual(list.length, 6, "services-item without JavaScript");
    list.forEach(function (item, i) {
      assert(isVisible(item), "item " + (i + 1) + " is not visible without JavaScript");
    });
    assertEqual(itemTexts(p).join("\n"), itemTexts(page.mobile).join("\n"), "texts without JavaScript");
    checkScrollable(p, "375px without JavaScript");
    assertEqual(byTestId(p.doc, "services-prev"), null, "services-prev without JavaScript");
    assertEqual(byTestId(p.doc, "services-next"), null, "services-next without JavaScript");
  });

  test("AC-F002-10 headings of the section are one h2 followed by h3 items", function (page) {
    var section = page.mobile.doc.getElementById("servicios");
    var tags = Array.prototype.map.call(section.querySelectorAll("h1, h2, h3, h4, h5, h6"), function (h) { return h.tagName; });
    assertEqual(tags.join(","), "H2,H3,H3,H3,H3,H3,H3", "heading order");
  });

  test("AC-F002-15 the track is a labelled, focusable region with a visible focus ring", function (page) {
    var p = page.mobile;
    var el = track(p);
    assert(el, "services-carousel missing");
    assertEqual(el.getAttribute("tabindex"), "0", "tabindex");
    assertEqual(el.getAttribute("role"), "region", "role");
    assert((el.getAttribute("aria-label") || "").trim().length > 0, "aria-label is empty");
    try {
      el.focus();
      assert(p.doc.activeElement === el, "the track does not take focus");
      var style = p.win.getComputedStyle(el);
      assert(style.outlineStyle !== "none", "outline-style is none when focused");
      assert(parseFloat(style.outlineWidth) >= 2, "outline-width " + style.outlineWidth + " < 2px");
    } finally {
      el.blur();
    }
  });

  // ---- T014: previous / next arrows (progressive enhancement) ----

  function firstFullyVisible(p) {
    var el = track(p);
    var list = items(p);
    for (var i = 0; i < list.length; i++) {
      if (fullyInTrack(el, list[i])) {
        return i;
      }
    }
    return -1;
  }

  test("AC-F002-11 at 1280px the arrows are visible buttons with labels and a 44px target", function (page) {
    var p = page.desktop;
    [
      { id: "services-prev", label: "Servicio anterior" },
      { id: "services-next", label: "Servicio siguiente" }
    ].forEach(function (spec) {
      var btn = byTestId(p.doc, spec.id);
      assert(btn, spec.id + " missing");
      assertEqual(btn.tagName, "BUTTON", spec.id + " tag");
      assert(isVisible(btn), spec.id + " is not visible");
      assertEqual(btn.closest('[data-testid="services-item"]'), null, spec.id + " is inside a services-item");
      assertEqual(btn.getAttribute("aria-label"), spec.label, spec.id + " aria-label");
      var rect = btn.getBoundingClientRect();
      assert(rect.width >= 44 && rect.height >= 44, spec.id + " is " + rect.width + "x" + rect.height + ", below 44x44");
    });
  });

  test("AC-F002-12 at 375px the arrows exist but are not visible", function (page) {
    var p = page.mobile;
    ["services-prev", "services-next"].forEach(function (id) {
      var btn = byTestId(p.doc, id);
      assert(btn, id + " missing");
      assert(!isVisible(btn), id + " is visible at 375px");
    });
  });

  test("AC-F002-13 next moves the track to the second card and enables previous", function (page) {
    var p = page.desktop;
    var el = track(p);
    var prev = byTestId(p.doc, "services-prev");
    var next = byTestId(p.doc, "services-next");
    assert(el && prev && next, "carousel or arrows missing");
    try {
      setScroll(p.win, el, 0);
      assert(prev.disabled, "services-prev is enabled at the start");
      var x0 = el.scrollLeft;
      next.click();
      assert(el.scrollLeft > x0, "scrollLeft did not increase: " + x0 + " -> " + el.scrollLeft);
      assertEqual(firstFullyVisible(p), 1, "first fully visible item after next");
      assert(!prev.disabled, "services-prev is still disabled after next");
    } finally {
      reset(p.win, el);
    }
  });

  test("AC-F002-14 previous moves the track back from the end and enables next", function (page) {
    var p = page.desktop;
    var el = track(p);
    var prev = byTestId(p.doc, "services-prev");
    var next = byTestId(p.doc, "services-next");
    assert(el && prev && next, "carousel or arrows missing");
    try {
      setScroll(p.win, el, el.scrollWidth);
      assert(next.disabled, "services-next is enabled at the end");
      var x0 = el.scrollLeft;
      prev.click();
      assert(el.scrollLeft < x0, "scrollLeft did not decrease: " + x0 + " -> " + el.scrollLeft);
      assert(!next.disabled, "services-next is still disabled after previous");
    } finally {
      reset(p.win, el);
    }
  });
})();
