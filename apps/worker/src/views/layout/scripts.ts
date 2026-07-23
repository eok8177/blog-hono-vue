export const inlineScript = () => /* javascript */ `
;(function(){
  var doc = document;
  var html = doc.documentElement;

  /* ── Reading progress ── */
  var scrollLockCount = 0;
  var previousOverflow = '';
  function lockScroll() {
    if (scrollLockCount++ === 0) previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (!scrollLockCount) html.style.overflow = previousOverflow;
  }

  var bar = doc.querySelector('.reading-progress');
  var ticking = false;
  if (bar) {
    function updateProgress() {
      var el = doc.scrollingElement || html;
      var st = el.scrollTop;
      var sh = el.scrollHeight - el.clientHeight;
      var pct = sh <= 0 ? 0 : Math.min(1, st / sh);
      html.style.setProperty('--reading-progress', pct);
    }
    window.addEventListener('scroll', function(){
      if (!ticking) { requestAnimationFrame(function(){ updateProgress(); ticking = false; }); ticking = true; }
    }, {passive: true});
    updateProgress();
  }

  /* ── Theme toggle ── */
  var toggle = doc.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function(){
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch(e) {}
    });
  }

  /* ── Mobile nav toggle ── */
  var navToggle = doc.getElementById('nav-toggle');
  var navMenu = doc.getElementById('nav-menu');
  if (navToggle && navMenu) {
    function openNav() {
      navToggle.setAttribute('aria-expanded', 'true');
      doc.body.classList.add('nav-open');
      lockScroll();
      doc.addEventListener('keydown', onNavKey);
    }
    function closeNav() {
      navToggle.setAttribute('aria-expanded', 'false');
      doc.body.classList.remove('nav-open');
      unlockScroll();
      doc.removeEventListener('keydown', onNavKey);
    }
    function onNavKey(e) {
      if (e.key === 'Escape') { closeNav(); navToggle.focus(); }
    }
    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (doc.body.classList.contains('nav-open')) { closeNav(); }
      else { openNav(); }
    });
    navMenu.addEventListener('click', function(e) {
      var target = e.target;
      if (target === navMenu || target instanceof Element && target.closest('.nav-menu-link')) {
        closeNav();
      }
    });
  }

  /* ── Lightbox ── */
  var lb = doc.getElementById('lightbox');
  var lbTrack = doc.getElementById('lightbox-track');
  var lbCounter = doc.getElementById('lightbox-counter');
  var lbCaption = doc.getElementById('lightbox-caption');
  var lbPrev = doc.getElementById('lightbox-prev');
  var lbNext = doc.getElementById('lightbox-next');
  var slides = [];
  var currentIdx = 0;
  var touchStartX = 0;
  var touchCurrentX = 0;
  var dragging = false;
  var animating = false;
  var transitionMs = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
  var slideEls = [];
  var galleryImages = [];
  var previousFocus = null;

  function buildSlides() {
    slides = [];
    galleryImages = Array.from(doc.querySelectorAll('.gallery img'));
    galleryImages.forEach(function(img) {
      var fig = img.closest('figure');
      var cap = fig ? fig.querySelector('figcaption') : null;
      var src = img.getAttribute('src') || '';
      slides.push({
        src: src.replace(/\\/960$/, '/1600'),
        alt: img.getAttribute('alt') || '',
        caption: cap ? cap.textContent : ''
      });
    });
  }

  function renderSlides() {
    if (!lbTrack) return;
    lbTrack.innerHTML = '';
    slideEls = slides.map(function(s, i) {
      var slide = doc.createElement('div');
      slide.className = 'lightbox-slide';
      var img = doc.createElement('img');
      img.setAttribute('data-src', s.src);
      img.alt = s.alt;
      img.decoding = 'async';
      img.loading = i === currentIdx ? 'eager' : 'lazy';
      slide.appendChild(img);
      lbTrack.appendChild(slide);
      return { slide: slide, img: img };
    });
    updateRenderedSlides();
  }

  function updateRenderedSlides() {
    slideEls.forEach(function(item, i) {
      var nearby = Math.abs(i - currentIdx) <= 1;
      item.slide.setAttribute('aria-hidden', i === currentIdx ? 'false' : 'true');
      if (nearby && !item.img.getAttribute('src')) {
        item.img.src = item.img.getAttribute('data-src') || '';
      } else if (!nearby) {
        item.img.removeAttribute('src');
      }
    });
  }

  function goTo(idx) {
    if (idx < 0 || idx >= slides.length || animating) return;
    animating = true;
    currentIdx = idx;
    updateRenderedSlides();
    lbTrack.style.transform = 'translateX(-' + (idx * 100) + '%)';
    updateCounter();
    updateButtons();
    setTimeout(function(){ animating = false; }, transitionMs);
  }

  function updateCounter() {
    if (lbCounter && slides.length > 1) {
      lbCounter.textContent = (currentIdx + 1) + ' / ' + slides.length;
      lbCounter.style.display = 'block';
    } else if (lbCounter) {
      lbCounter.style.display = 'none';
    }
    if (lbCaption) {
      lbCaption.textContent = slides[currentIdx] ? slides[currentIdx].caption : '';
      lbCaption.style.display = slides[currentIdx] && slides[currentIdx].caption ? 'block' : 'none';
    }
  }

  function updateButtons() {
    var prev = lbPrev;
    var next = lbNext;
    if (prev) {
      prev.disabled = slides.length < 2 || currentIdx === 0;
      prev.hidden = slides.length < 2;
    }
    if (next) {
      next.disabled = slides.length < 2 || currentIdx === slides.length - 1;
      next.hidden = slides.length < 2;
    }
  }

  function open(idx) {
    if (!lb) return;
    if (!slides.length) return;
    currentIdx = Math.max(0, Math.min(idx, slides.length - 1));
    renderSlides();
    lbTrack.style.transition = 'none';
    lbTrack.style.transform = 'translateX(-' + (currentIdx * 100) + '%)';
    /* force reflow */
    lbTrack.offsetHeight;
    lbTrack.style.transition = 'transform ' + (transitionMs / 1000) + 's cubic-bezier(.4,0,.2,1)';
    updateCounter();
    updateButtons();
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('is-open');
    previousFocus = doc.activeElement;
    lockScroll();
    lb.focus();
    doc.addEventListener('keydown', onKey);
  }

  function close() {
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    unlockScroll();
    doc.removeEventListener('keydown', onKey);
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    previousFocus = null;
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { goTo(currentIdx - 1); return; }
    if (e.key === 'ArrowRight') { goTo(currentIdx + 1); return; }
    if (e.key === 'Tab' && lb) {
      var focusable = Array.from(lb.querySelectorAll('button:not([hidden]):not([disabled])'));
      if (!focusable.length) { e.preventDefault(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ── Touch / swipe ── */
  if (lbTrack) {
    lbTrack.addEventListener('touchstart', function(e) {
      if (animating || slides.length < 2) return;
      touchStartX = e.touches[0].clientX;
      touchCurrentX = touchStartX;
      dragging = true;
      lbTrack.style.transition = 'none';
    }, {passive: true});

    lbTrack.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      touchCurrentX = e.touches[0].clientX;
      var dx = touchCurrentX - touchStartX;
      var offset = -currentIdx * 100 + (dx / lbTrack.offsetWidth) * 100;
      /* clamp */
      if (currentIdx === 0 && dx > 0) offset = Math.min(0, offset);
      if (currentIdx === slides.length - 1 && dx < 0) offset = Math.max(-(slides.length - 1) * 100, offset);
      lbTrack.style.transform = 'translateX(' + offset + '%)';
    }, {passive: true});

    lbTrack.addEventListener('touchend', function() {
      if (!dragging) return;
      dragging = false;
      lbTrack.style.transition = 'transform ' + (transitionMs / 1000) + 's cubic-bezier(.4,0,.2,1)';
      var dx = touchCurrentX - touchStartX;
      if (dx < -40) { goTo(currentIdx + 1); }
      else if (dx > 40) { goTo(currentIdx - 1); }
      else { goTo(currentIdx); }
    });
  }

  /* ── Click handlers ── */
  doc.addEventListener('click', function(e) {
    var target = e.target;
    if (!(target instanceof Element)) return;
    /* open: click on gallery image */
    var galleryImg = target.closest('.gallery img');
    if (galleryImg) {
      e.preventDefault();
      buildSlides();
      open(galleryImages.indexOf(galleryImg));
      return;
    }
    /* close: backdrop or close button */
    if (target.hasAttribute('data-lightbox-close') || target.closest('[data-lightbox-close]')) {
      close();
      return;
    }
  });

  /* prev / next buttons */
  var prevBtn = lbPrev;
  var nextBtn = lbNext;
  if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); goTo(currentIdx + 1); });

  /* ── Table data-labels for mobile cards ── */
  var tables = doc.querySelectorAll('.markdown table');
  tables.forEach(function(table) {
    var headers = [];
    var ths = table.querySelectorAll('thead th');
    ths.forEach(function(th) { headers.push((th.textContent || '').trim()); });
    if (!headers.length) return;
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(tr) {
      var tds = tr.querySelectorAll('td');
      tds.forEach(function(td, i) {
        if (headers[i]) td.setAttribute('data-label', headers[i]);
      });
    });
  });
})();
`;
