(function () {
  'use strict';
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  var OLD_CARD = [
    { label: 'الاسم', value: '______________' },
    { label: 'القيمة', value: 'على حسب إنجازاتي' },
    { label: 'الهوية', value: 'رأي الناس فيّا' },
    { label: 'الحالة', value: 'بحاول أنتمي' },
    { label: 'العنوان', value: 'في كل مكان… إلا البيت' }
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function oldCardHTML() {
    var rows = OLD_CARD.map(function (r) {
      return '<div class="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-2 border-b border-dashed border-border pb-1.5">' +
        '<dt class="text-xs text-muted-foreground">' + esc(r.label) + '</dt>' +
        '<dd class="truncate text-sm font-semibold sm:text-base text-muted-foreground">' + esc(r.value) + '</dd></div>';
    }).join('');
    return '<div class="watermark surface mx-auto w-full max-w-xl rounded-3xl p-5 transition-all duration-700 sm:p-7">' +
      '<div class="relative z-10 flex items-start justify-between gap-3"><div class="min-w-0">' +
      '<p class="font-mono text-[10px] tracking-[0.25em] text-muted-foreground">IDENTITY CARD \u00B7 DRAFT</p>' +
      '<h3 class="font-display truncate text-lg font-bold sm:text-xl">بطاقة هوية شخصية</h3></div>' +
      '<span class="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold bg-secondary text-muted-foreground">غير مكتملة</span></div>' +
      '<div class="relative z-10 mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">' +
      '<div class="grid h-24 w-20 shrink-0 place-items-center rounded-2xl border border-border text-3xl bg-secondary">?</div>' +
      '<dl class="min-w-0 space-y-2.5">' + rows + '</dl></div>' +
      '<div class="relative z-10 mt-5 flex items-center gap-3"><div class="barcode h-8 flex-1 rounded opacity-70"></div>' +
      '<span class="font-mono shrink-0 text-[10px] text-muted-foreground">N/A \u00B7 2026</span></div></div>';
  }

  onReady(function () {
    // 1) Fix stage cards: deep-link to journey with stage index
    var cards = document.querySelectorAll('main section.mx-auto.grid a.surface');
    if (cards.length === 4) {
      cards.forEach(function (a, i) {
        a.setAttribute('href', './journey.html?stage=' + i);
      });
    }

    // 2) Hero multi-step (زر كمّل)
    var hero = document.querySelector('main section.min-h-\\[68vh\\], main section');
    if (!hero) return;
    var h1 = hero.querySelector('h1');
    var btn = hero.querySelector('button');
    if (!h1 || !btn) return;
    if (hero.getAttribute('data-vanilla-index') === '1') return;
    hero.setAttribute('data-vanilla-index', '1');

    var step = 0;
    var T0 = 'إنت مين؟';
    var T1 = 'ولو كل اللي عارفه عن نفسك… مش هو الحقيقة؟';
    btn.setAttribute('type', 'button');

    // container for step-2 extra content (created once)
    var extra = document.createElement('div');
    extra.className = 'animate-fade-in mx-auto max-w-4xl px-5 pb-8 w-full';
    extra.style.display = 'none';
    extra.innerHTML =
      '<p class="mt-8 max-w-xl mx-auto text-sm text-muted-foreground text-center">دي بطاقتك الحالية… زي ما إحنا بنعرّف نفسنا كل يوم.</p>' +
      '<div class="mt-6">' + oldCardHTML() + '</div>' +
      '<div class="mt-8 flex flex-wrap justify-center gap-3">' +
      '<a href="./journey.html" class="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">ابدأ الرحلة \u00B7 12 شهر</a>' +
      '<a href="./new-identity.html" class="rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold transition hover:-translate-y-0.5">شوف النهاية</a>' +
      '</div>';
    hero.parentNode.insertBefore(extra, hero.nextSibling);

    function render() {
      if (step === 0) {
        h1.textContent = T0;
        btn.style.display = '';
        btn.textContent = 'كمّل';
        extra.style.display = 'none';
        h1.classList.remove('translate-y-2', 'opacity-0', 'blur-sm');
        h1.classList.add('opacity-100', 'blur-0');
      } else if (step === 1) {
        h1.textContent = T1;
        btn.style.display = '';
        btn.textContent = 'كمّل';
        extra.style.display = 'none';
      } else {
        h1.textContent = T1;
        btn.style.display = 'none';
        extra.style.display = '';
        if (extra.scrollIntoView) { try { extra.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }
      }
    }

    btn.addEventListener('click', function () {
      step = Math.min(step + 1, 2);
      render();
    });
    render();
  });
})();
