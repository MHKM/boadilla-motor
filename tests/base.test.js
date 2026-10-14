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
