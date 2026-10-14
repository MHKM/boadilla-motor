"use strict";

// In-browser test harness (T001). Contract: .factory/artifacts/M01/design.md.
// Globals: test, assert, assertEqual, assertMatch, byTestId, allByTestId, text,
// isVisible, loadFrame, runTests. No dependencies.

(function (global) {
  var registry = [];
  var currentSuite = "";
  var strayFrames = [];

  var FRAME_TIMEOUT = 5000;
  var TEST_TIMEOUT = 8000;

  // ---- registration and assertions ----

  global.test = function (name, fn) {
    registry.push({ name: String(name), fn: fn, suite: currentSuite });
  };

  global.assert = function (cond, message) {
    if (!cond) {
      throw new Error(message || "assertion failed");
    }
  };

  global.assertEqual = function (actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        (message || "values differ") +
          ": expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual)
      );
    }
  };

  global.assertMatch = function (str, re, message) {
    if (typeof str !== "string" || !re.test(str)) {
      throw new Error(
        (message || "value does not match") + ": " + JSON.stringify(str) + " !~ " + String(re)
      );
    }
  };

  // ---- DOM helpers ----

  global.byTestId = function (doc, id) {
    return doc.querySelector('[data-testid="' + id + '"]');
  };

  global.allByTestId = function (doc, id) {
    return Array.prototype.slice.call(doc.querySelectorAll('[data-testid="' + id + '"]'));
  };

  global.text = function (el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  };

  global.isVisible = function (el) {
    if (!el || !el.ownerDocument || !el.ownerDocument.defaultView) {
      return false;
    }
    var style = el.ownerDocument.defaultView.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    if (el.getClientRects().length === 0) {
      return false;
    }
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // ---- frames ----

  function framesHost() {
    var host = document.getElementById("frames");
    if (!host) {
      host = document.createElement("div");
      host.id = "frames";
      document.body.appendChild(host);
    }
    return host;
  }

  // src is relative to tests/. Resolves with {doc, win, frame} once loaded.
  global.loadFrame = function (src, width, height, options) {
    var scripts = !options || options.scripts !== false;
    return new Promise(function (resolve, reject) {
      var frame = document.createElement("iframe");
      var timer;
      frame.setAttribute("title", src);
      frame.setAttribute("tabindex", "-1");
      frame.style.cssText =
        "position:absolute;left:-20000px;top:0;border:0;width:" + width + "px;height:" + (height || 900) + "px";
      if (!scripts) {
        frame.setAttribute("sandbox", "allow-same-origin");
      }
      frame.addEventListener("load", function () {
        var doc;
        try {
          doc = frame.contentDocument;
        } catch (err) {
          doc = null;
        }
        if (doc && doc.location.href === "about:blank") {
          return; // not the real document yet
        }
        clearTimeout(timer);
        if (!doc || !frame.contentWindow) {
          reject(new Error("cannot read document of " + src + " (file access blocked?)"));
          return;
        }
        resolve({ doc: doc, win: frame.contentWindow, frame: frame });
      });
      timer = setTimeout(function () {
        reject(new Error("timeout loading " + src));
      }, FRAME_TIMEOUT);
      frame.src = src; // set before attaching so no initial about:blank load event fires
      framesHost().appendChild(frame);
      strayFrames.push(frame);
    });
  };

  // ---- runner ----

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("timeout after " + ms + "ms in " + label));
      }, ms);
      promise.then(
        function (value) { clearTimeout(timer); resolve(value); },
        function (err) { clearTimeout(timer); reject(err); }
      );
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("cannot load " + src)); };
      document.head.appendChild(s);
    });
  }

  function oneLine(value) {
    return String(value).replace(/\s+/g, " ").trim();
  }

  function render(results) {
    var failed = results.filter(function (r) { return !r.ok; }).length;
    var lines = results.map(function (r) {
      return r.ok ? "PASS " + r.name : "FAIL " + r.name + " :: " + oneLine(r.message);
    });
    if (results.length > 0 && failed === 0) {
      lines.push("RESULT: PASS " + results.length + "/" + results.length);
    } else {
      lines.push("RESULT: FAIL " + failed + "/" + results.length);
    }
    var pre = document.getElementById("results");
    pre.textContent = lines.join("\n");
    document.documentElement.setAttribute("data-done", "true");
  }

  // suites: all suite ids. ?suite=<id> restricts the run to that one.
  global.runTests = function (suites) {
    var results = [];
    var match = /[?&]suite=([^&]*)/.exec(global.location.search);
    var only = match ? decodeURIComponent(match[1]) : "";
    var selected = suites;
    var pages = {};

    function fail(name, message) {
      results.push({ name: name, ok: false, message: message });
    }

    function loadPages() {
      var pending = [
        global.loadFrame("../index.html", 375, 812).then(function (p) { pages.mobile = p; }),
        global.loadFrame("../index.html", 1280, 900).then(function (p) { pages.desktop = p; }),
        global.loadFrame("../index.html", 375, 812, { scripts: false }).then(function (p) { pages.nojs = p; })
      ];
      return Promise.all(pending);
    }

    function runOne(t) {
      var before = strayFrames.length;
      return withTimeout(Promise.resolve().then(function () { return t.fn(pages); }), TEST_TIMEOUT, t.name)
        .then(
          function () { results.push({ name: t.name, ok: true }); },
          function (err) { fail(t.name, err && err.message ? err.message : err); }
        )
        .then(function () {
          // remove frames the test opened itself (keep the three page frames)
          var keep = [pages.mobile, pages.desktop, pages.nojs].map(function (p) { return p && p.frame; });
          strayFrames.slice(before).forEach(function (f) {
            if (keep.indexOf(f) === -1 && f.parentNode) {
              f.parentNode.removeChild(f);
            }
          });
        });
    }

    var chain = Promise.resolve();

    if (only) {
      if (suites.indexOf(only) === -1) {
        fail("suite " + only + " not found", "not registered in SUITES");
        selected = [];
      } else {
        selected = [only];
      }
    }

    selected.forEach(function (id) {
      chain = chain.then(function () {
        currentSuite = id;
        return loadScript(id + ".test.js").catch(function () {
          fail("suite " + id + " not found", "cannot load tests/" + id + ".test.js");
        });
      });
    });

    chain = chain.then(function () {
      if (registry.length === 0) {
        return null;
      }
      return loadPages().then(function () {
        var seq = Promise.resolve();
        registry.forEach(function (t) {
          seq = seq.then(function () { return runOne(t); });
        });
        return seq;
      }, function (err) {
        fail("runner pages", err && err.message ? err.message : err);
      });
    });

    return chain.then(
      function () { render(results); },
      function (err) {
        fail("runner", err && err.message ? err.message : err);
        render(results);
      }
    );
  };
})(window);
