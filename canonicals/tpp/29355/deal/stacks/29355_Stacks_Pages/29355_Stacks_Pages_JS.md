---
slug: 29355_Stacks_Pages_JS
module_type: stack-js
sd_item_id: 29355
platform: tpp
cu_page_id: 80djf-701717
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-701717'
cu_parent_page_id: 80djf-701517
cu_path: >-
  Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_Pages
  > 29355_Stacks_Pages_JS
last_synced: '2026-05-08'
last_editor: JLW
status: live
parent_stack_slug: 29355_Stacks_Pages
---
```javascript
window.TPP = window.TPP || { initialized: false };

function tppBoot() {
  if (window.TPP.initialized) return;
  var root = document.querySelector('.tpp-lp');
  if (!root) return false;

  window.TPP.initialized = true;
  window.TPP.root = root;

  // Mark JS as active so CSS reveals can apply (CSS keeps content visible without this class)
  root.classList.add('tpp-js');

  // Honor prefers-reduced-motion: skip non-essential animations entirely
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tppInitParallaxOrbs(root, reduceMotion);
  tppInitRevealObserver(root);
  tppInitHeroStagger(root);
  tppInitPhaseLineDraw(root);
  tppInitStatCounters(root, reduceMotion);
  tppInitQrFlip(root);
  tppInitHeaderScrolled(root);

  return true;
}

// Boot sequence: try immediately, on Pace done, on DOMContentLoaded, then poll.
if (document.readyState !== 'loading') {
  tppBoot();
}
document.addEventListener('DOMContentLoaded', tppBoot);
window.addEventListener('load', tppBoot);

if (window.Pace && typeof window.Pace.on === 'function') {
  window.Pace.on('done', tppBoot);
}

// Polling fallback for late Text Block injection (every 250ms, max 32 attempts = 8s)
var tppPollCount = 0;
var tppPollTimer = setInterval(function () {
  tppPollCount++;
  if (tppBoot() || tppPollCount >= 32) {
    clearInterval(tppPollTimer);
  }
}, 250);

// Parallax hero orbs — translate on scroll for depth
function tppInitParallaxOrbs(root, reduceMotion) {
  if (reduceMotion) return;
  var orbs = root.querySelectorAll('[data-parallax]');
  if (!orbs.length) return;

  var ticking = false;
  function update() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    orbs.forEach(function (orb) {
      var rate = parseFloat(orb.getAttribute('data-parallax')) || 0;
      orb.style.transform = 'translate3d(0, ' + (scrollY * rate) + 'px, 0)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

// Reveal observer — adds .tpp-in when elements scroll into view
function tppInitRevealObserver(root) {
  var targets = root.querySelectorAll('.tpp-reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('tpp-in'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('tpp-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { observer.observe(el); });
}

// Hero stagger release — adds .tpp-loaded shortly after boot to trigger sequenced reveal
function tppInitHeroStagger(root) {
  setTimeout(function () { root.classList.add('tpp-loaded'); }, 80);
}

// Phase rail draw-on — triggers SVG line draw when rail enters viewport
function tppInitPhaseLineDraw(root) {
  var rail = root.querySelector('#tpp-phase-rail');
  if (!rail) return;

  if (!('IntersectionObserver' in window)) {
    rail.classList.add('is-drawn');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        rail.classList.add('is-drawn');
        observer.unobserve(rail);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(rail);
}

// Animated stat counters — count from 0 to data-count when stats bar enters view
function tppInitStatCounters(root, reduceMotion) {
  var stats = root.querySelectorAll('.tpp-stat-num');
  if (!stats.length) return;

  // Cache final display values (already hardcoded in HTML for no-JS safety)
  stats.forEach(function (el) {
    el.setAttribute('data-final', el.textContent.trim());
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    return;
  }

  // Reset to 0 only when JS is going to animate
  stats.forEach(function (el) {
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = '0' + suffix;
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1600;
      var start = performance.now();

      function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Restore exact final value (preserves "100%", "24hr", etc.)
          el.textContent = el.getAttribute('data-final');
        }
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });

  stats.forEach(function (el) { observer.observe(el); });
}

// QR card flip on click / tap
function tppInitQrFlip(root) {
  var card = root.querySelector('.tpp-qr-card');
  if (!card) return;
  card.addEventListener('click', function () {
    card.classList.toggle('is-flipped');
  });
}

// Sticky header — adds .is-scrolled when page is scrolled
function tppInitHeaderScrolled(root) {
  var header = root.querySelector('.tpp-header');
  if (!header) return;

  function update() {
    if ((window.pageYOffset || document.documentElement.scrollTop) > 24) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}
```
