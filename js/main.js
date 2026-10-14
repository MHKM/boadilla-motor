"use strict";

// Progressive enhancement: previous / next arrows for the services carousel (F002).
// The page is complete without this script.

(function () {
  var SVG_NS = "http://www.w3.org/2000/svg";

  var track = document.querySelector('[data-testid="services-carousel"]');
  if (!track) {
    return;
  }
  var items = Array.prototype.slice.call(track.querySelectorAll('[data-testid="services-item"]'));
  if (items.length < 2) {
    return;
  }

  function createArrow(testId, label, pathData) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "services__arrow";
    button.setAttribute("data-testid", testId);
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-controls", track.id);
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", pathData);
    svg.appendChild(path);
    button.appendChild(svg);
    return button;
  }

  var nav = document.createElement("div");
  nav.className = "services__nav";
  var prev = createArrow("services-prev", "Servicio anterior", "M15 18l-6-6 6-6");
  var next = createArrow("services-next", "Servicio siguiente", "M9 6l6 6-6 6");
  nav.appendChild(prev);
  nav.appendChild(next);
  track.parentNode.insertBefore(nav, track.nextSibling);

  function offset(i) {
    return items[i].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
  }

  // Index of the first card whose left edge is inside the track (0 if none).
  function current() {
    var left = track.getBoundingClientRect().left;
    for (var i = 0; i < items.length; i++) {
      if (items[i].getBoundingClientRect().left >= left - 1) {
        return i;
      }
    }
    return 0;
  }

  function update() {
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }

  function go(i) {
    var index = Math.max(0, Math.min(items.length - 1, i));
    // No "behavior" option: CSS scroll-behavior decides between smooth and instant.
    track.scrollTo({ left: offset(index) });
    update();
  }

  prev.addEventListener("click", function () {
    go(current() - 1);
  });
  next.addEventListener("click", function () {
    go(current() + 1);
  });
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
