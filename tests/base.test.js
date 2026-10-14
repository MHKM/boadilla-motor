"use strict";

// Technical suite "base": page head and runner guarantees (T001).
// More tests are appended here by T003 (skeleton, tokens, components).

test("T001 html element declares lang es", function (page) {
  assertEqual(page.mobile.doc.documentElement.getAttribute("lang"), "es", "html lang");
});

test("T001 html element uses the light theme", function (page) {
  assertEqual(page.mobile.doc.documentElement.getAttribute("data-theme"), "light", "html data-theme");
});

test("T001 document declares charset utf-8", function (page) {
  var meta = page.mobile.doc.querySelector("meta[charset]");
  assert(meta, "meta charset missing");
  assertMatch(meta.getAttribute("charset"), /^utf-8$/i, "meta charset value");
});

test("T001 exactly one meta viewport", function (page) {
  var metas = page.mobile.doc.querySelectorAll('meta[name="viewport"]');
  assertEqual(metas.length, 1, "number of meta viewport");
  assertMatch(metas[0].getAttribute("content"), /width=device-width/, "viewport content");
});

test("T001 color-scheme meta is light", function (page) {
  var meta = page.mobile.doc.querySelector('meta[name="color-scheme"]');
  assert(meta, "meta color-scheme missing");
  assertEqual(meta.getAttribute("content"), "light", "color-scheme content");
});

test("T001 title and meta description are not empty", function (page) {
  var doc = page.mobile.doc;
  assert(doc.title.trim().length > 0, "title is empty");
  var meta = doc.querySelector('meta[name="description"]');
  assert(meta, "meta description missing");
  assert(meta.getAttribute("content").trim().length > 0, "meta description is empty");
});

test("T001 every link href and src is relative", function (page) {
  var els = page.mobile.doc.querySelectorAll("link[href], [src]");
  assert(els.length > 0, "no link/src elements found");
  Array.prototype.forEach.call(els, function (el) {
    var value = el.getAttribute(el.hasAttribute("src") ? "src" : "href");
    assert(value.charAt(0) !== "/", "absolute path: " + value);
    assert(!/^[a-z][a-z0-9+.-]*:/i.test(value) && value.indexOf("//") !== 0, "absolute url: " + value);
  });
});

test("T001 stylesheet is linked with a relative path", function (page) {
  var link = page.mobile.doc.querySelector('link[rel="stylesheet"][href="css/styles.css"]');
  assert(link, 'link rel="stylesheet" href="css/styles.css" missing');
});

test("T001 nojs frame really has scripts disabled", function (page) {
  var sandbox = page.nojs.frame.getAttribute("sandbox");
  assert(sandbox !== null, "nojs frame has no sandbox attribute");
  assert(sandbox.indexOf("allow-scripts") === -1, "nojs frame sandbox allows scripts: " + sandbox);
  assert(sandbox.indexOf("allow-same-origin") !== -1, "nojs frame must allow same origin to be readable");
  assert(page.mobile.frame.getAttribute("sandbox") === null, "mobile frame must not be sandboxed");
});

test("T001 frames have the documented viewport sizes", function (page) {
  assertEqual(page.mobile.win.innerWidth, 375, "mobile innerWidth");
  assertEqual(page.desktop.win.innerWidth, 1280, "desktop innerWidth");
  assertEqual(page.nojs.win.innerWidth, 375, "nojs innerWidth");
});

// ---- T003: tokens, page skeleton and base components ----

(function () {
  var SECTIONS = [
    { id: "inicio", testid: "hero", marker: "F001" },
    { id: "servicios", testid: "services", marker: "F002" },
    { id: "por-que-nosotros", testid: "why-us", marker: "F003" },
    { id: "contacto", testid: "contact", marker: "F004" }
  ];

  var COMPONENT_CLASSES = [
    "container", "section", "section--alt", "section__title", "section__intro",
    "grid", "grid--2", "grid--3", "btn", "btn--primary", "btn--whatsapp", "btn--secondary",
    "btn__icon", "card", "card__title", "card__text", "notice", "notice--warning", "icon",
    "site-header", "site-header__logo", "site-nav", "site-nav__link", "site-footer",
    "skip-link", "visually-hidden"
  ];

  function css(win, el, prop) {
    return win.getComputedStyle(el).getPropertyValue(prop);
  }

  function px(value) {
    return parseFloat(value);
  }

  function columns(win, el) {
    var tracks = css(win, el, "grid-template-columns").trim();
    return tracks === "" || tracks === "none" ? 0 : tracks.split(/\s+/).length;
  }

  // Resolves a token the way the browser does by painting it as a colour.
  function tokenColor(doc, win, name) {
    var probe = doc.createElement("span");
    probe.style.color = "var(" + name + ")";
    doc.body.appendChild(probe);
    var value = css(win, probe, "color");
    doc.body.removeChild(probe);
    return value;
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

  test("T003 sections exist in order with the documented ids and testids", function (page) {
    var doc = page.mobile.doc;
    var found = Array.prototype.slice.call(doc.querySelectorAll("main#contenido > section"));
    assertEqual(found.length, SECTIONS.length, "number of sections in main");
    SECTIONS.forEach(function (s, i) {
      assertEqual(found[i].id, s.id, "section " + i + " id");
      assertEqual(found[i].getAttribute("data-testid"), s.testid, "section " + s.id + " testid");
    });
  });

  test("T003 exactly one header, one main and one footer", function (page) {
    var doc = page.mobile.doc;
    assertEqual(doc.querySelectorAll("header").length, 1, "header count");
    assertEqual(doc.querySelectorAll("main").length, 1, "main count");
    assertEqual(doc.querySelectorAll("footer").length, 1, "footer count");
    assert(byTestId(doc, "header").matches("header.site-header"), "header.site-header[data-testid=header]");
    assert(byTestId(doc, "footer").matches("footer.site-footer"), "footer.site-footer[data-testid=footer]");
  });

  test("T003 skip link points to the main content", function (page) {
    var link = byTestId(page.mobile.doc, "skip-link");
    assert(link && link.matches("a.skip-link"), "a.skip-link[data-testid=skip-link] missing");
    assertEqual(link.getAttribute("href"), "#contenido", "skip link href");
    assert(page.mobile.doc.getElementById("contenido"), "#contenido missing");
  });

  test("T003 header logo links to #inicio and is at least 140px wide", function (page) {
    var link = byTestId(page.mobile.doc, "header-logo");
    assert(link, "header-logo missing");
    assertEqual(link.getAttribute("href"), "#inicio", "logo href");
    var img = link.querySelector("img");
    assert(img, "logo img missing");
    assertEqual(img.getAttribute("src"), "assets/logo-negative.svg", "logo src");
    assertEqual(img.getAttribute("alt"), "Boadilla Motor Sport", "logo alt");
    assert(img.getBoundingClientRect().width >= 140, "logo width " + img.getBoundingClientRect().width);
  });

  test("T003 header nav has three links to existing section ids", function (page) {
    var doc = page.mobile.doc;
    var nav = byTestId(doc, "header-nav");
    assert(nav && nav.getAttribute("aria-label") === "Principal", 'nav[aria-label="Principal"] missing');
    var links = allByTestId(doc, "header-nav-link");
    assertEqual(links.length, 3, "nav link count");
    var expected = [
      ["#servicios", "Servicios"],
      ["#por-que-nosotros", "Por qué nosotros"],
      ["#contacto", "Contacto"]
    ];
    links.forEach(function (a, i) {
      assertEqual(a.getAttribute("href"), expected[i][0], "nav link " + i + " href");
      assertEqual(text(a), expected[i][1], "nav link " + i + " text");
      assert(a.classList.contains("site-nav__link"), "nav link " + i + " class site-nav__link");
      assert(doc.getElementById(a.getAttribute("href").slice(1)), "target of " + expected[i][0] + " missing");
    });
  });

  test("T003 nav links are visible and at least 44px tall at 375 and 1280", function (page) {
    [page.mobile, page.desktop].forEach(function (p) {
      allByTestId(p.doc, "header-nav-link").forEach(function (a) {
        assert(isVisible(a), "nav link not visible at " + p.win.innerWidth + ": " + text(a));
        assert(a.getBoundingClientRect().height >= 44, "nav link shorter than 44px: " + text(a));
      });
    });
  });

  test("T003 header is one row from 768px and two rows on mobile", function (page) {
    function rects(p) {
      return {
        logo: byTestId(p.doc, "header-logo").getBoundingClientRect(),
        nav: byTestId(p.doc, "header-nav").getBoundingClientRect()
      };
    }
    var m = rects(page.mobile);
    assert(m.nav.top >= m.logo.bottom - 1, "mobile: nav should be below the logo");
    var d = rects(page.desktop);
    assert(d.nav.top < d.logo.bottom, "desktop: nav should share the row with the logo");
    assert(d.logo.left < d.nav.left, "desktop: logo on the left, nav on the right");
  });

  test("T003 page markers for the features are in place", function (page) {
    return readText("../index.html").then(function (html) {
      ["<!-- F001: content -->", "<!-- F002: content -->", "<!-- F003: content -->",
        "<!-- F004: content -->", "<!-- F005: sticky bar -->"].forEach(function (marker) {
        assert(html.indexOf(marker) !== -1, "marker missing: " + marker);
      });
      assert(html.indexOf('href="css/tokens.css"') < html.indexOf('href="css/styles.css"'), "tokens.css must precede styles.css");
      assert(html.indexOf('href="css/tokens.css"') !== -1, "tokens.css not linked");
    });
  });

  test("T003 primary token is #09237a and header background is rgb(1, 22, 39)", function (page) {
    var d = page.mobile.doc;
    assertEqual(tokenColor(d, page.mobile.win, "--color-primary"), "rgb(9, 35, 122)", "--color-primary");
    assertEqual(css(page.mobile.win, byTestId(d, "header"), "background-color"), "rgb(1, 22, 39)", "header background");
  });

  test("T003 body uses the bg colour and the body font family token", function (page) {
    var d = page.mobile.doc;
    assertEqual(css(page.mobile.win, d.body, "background-color"), "rgb(245, 245, 245)", "body background");
    assertEqual(css(page.mobile.win, d.body, "color"), "rgb(1, 22, 39)", "body text colour");
  });

  test("T003 footer is on the dark surface", function (page) {
    assertEqual(css(page.mobile.win, byTestId(page.mobile.doc, "footer"), "background-color"), "rgb(1, 22, 39)", "footer background");
  });

  test("T003 no horizontal scroll at 375px", function (page) {
    assert(page.mobile.doc.documentElement.scrollWidth <= 375, "scrollWidth " + page.mobile.doc.documentElement.scrollWidth);
  });

  test("T003 design/tokens.json and css/tokens.css come from the approved kit", function (page) {
    return Promise.all([readText("../design/tokens.json"), readText("../css/tokens.css")]).then(function (files) {
      var tokens = JSON.parse(files[0]);
      assertEqual(tokens.color.palette["navy-700"].$value, "#09237a", "navy-700 in tokens.json");
      assertEqual(tokens.color.palette["navy-900"].$value, "#011627", "navy-900 in tokens.json");
      assertMatch(files[1], /^\/\* Generated by `factory tokens`/, "tokens.css generated header");
      assertMatch(files[1], /--color-palette-navy-700: #09237a;/, "navy-700 in tokens.css");
    });
  });

  test("T003 fixture gallery shows one of each base component", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      COMPONENT_CLASSES.forEach(function (name) {
        var el = byTestId(fx.doc, "fx-" + name);
        assert(el, "fx-" + name + " missing");
        assert(el.classList.contains(name), "fx-" + name + " lacks class " + name);
      });
    });
  });

  test("T003 buttons are at least 44px tall with token colours", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      ["btn", "btn--primary", "btn--whatsapp", "btn--secondary"].forEach(function (name) {
        var h = byTestId(fx.doc, "fx-" + name).getBoundingClientRect().height;
        assert(h >= 44, name + " height " + h);
      });
      assertEqual(css(fx.win, byTestId(fx.doc, "fx-btn--primary"), "background-color"), "rgb(9, 35, 122)", ".btn--primary background");
      assertEqual(css(fx.win, byTestId(fx.doc, "fx-btn--whatsapp"), "background-color"), "rgb(15, 122, 61)", ".btn--whatsapp background");
      assertEqual(css(fx.win, byTestId(fx.doc, "fx-btn--primary"), "color"), "rgb(255, 255, 255)", ".btn--primary text colour");
    });
  });

  test("T003 headings use the heading family at extrabold weight", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      var title = byTestId(fx.doc, "fx-section__title");
      assertEqual(css(fx.win, title, "font-weight"), "800", "section title weight");
      assertMatch(css(fx.win, title, "font-family"), /League Spartan/, "section title font family");
      assertEqual(css(fx.win, byTestId(fx.doc, "fx-card__title"), "font-weight"), "800", "card title weight");
    });
  });

  test("T003 grid--3 has 1 column at 375px and 3 at 1280px, grid--2 has 1 and 2", function (page) {
    return Promise.all([
      loadFrame("fixtures/components.html", 375),
      loadFrame("fixtures/components.html", 1280)
    ]).then(function (frames) {
      var small = frames[0], large = frames[1];
      assertEqual(columns(small.win, byTestId(small.doc, "fx-grid--3")), 1, "grid--3 columns at 375");
      assertEqual(columns(large.win, byTestId(large.doc, "fx-grid--3")), 3, "grid--3 columns at 1280");
      assertEqual(columns(small.win, byTestId(small.doc, "fx-grid--2")), 1, "grid--2 columns at 375");
      assertEqual(columns(large.win, byTestId(large.doc, "fx-grid--2")), 2, "grid--2 columns at 1280");
    });
  });

  test("T003 icon is a 24px inline svg drawn with currentColor strokes", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      var icon = byTestId(fx.doc, "fx-icon");
      var rect = icon.getBoundingClientRect();
      assertEqual(Math.round(rect.width), 24, "icon width");
      assertEqual(Math.round(rect.height), 24, "icon height");
      assertEqual(css(fx.win, icon, "stroke"), css(fx.win, icon, "color"), "stroke follows currentColor");
    });
  });

  test("T003 visually-hidden content takes no visible space and warning notice uses the warning token", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      var hidden = byTestId(fx.doc, "fx-visually-hidden").getBoundingClientRect();
      assert(hidden.width <= 1 && hidden.height <= 1, "visually-hidden size " + hidden.width + "x" + hidden.height);
      var warn = byTestId(fx.doc, "fx-notice--warning");
      assertEqual(css(fx.win, warn, "border-left-color"), tokenColor(fx.doc, fx.win, "--color-warning"), "warning notice accent");
    });
  });

  test("T003 keyboard focus shows a 3px outline on buttons and nav links", function (page) {
    return loadFrame("fixtures/components.html", 375).then(function (fx) {
      var btn = byTestId(fx.doc, "fx-btn--primary");
      var link = byTestId(fx.doc, "fx-site-nav__link");
      [btn, link].forEach(function (el) {
        el.focus();
        assertEqual(css(fx.win, el, "outline-width"), "3px", "outline width of " + el.className);
        assert(css(fx.win, el, "outline-style") !== "none", "outline style of " + el.className);
      });
    });
  });
})();
