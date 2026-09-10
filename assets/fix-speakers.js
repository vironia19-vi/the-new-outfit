(function () {
  'use strict';
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad3(n) {
    n = String(n);
    while (n.length < 3) n = '0' + n;
    return n;
  }

  onReady(function () {
    if (!window.SPEAKERS) return;
    var DATA = window.SPEAKERS;
    var CATS = window.SPEAKER_CATS || [];
    var main = document.querySelector('main.mx-auto.max-w-6xl');
    if (!main) return;
    if (main.getAttribute('data-vanilla-speakers') === '1') return;
    main.setAttribute('data-vanilla-speakers', '1');

    var input = main.querySelector('input[placeholder]');
    var filterWrap = main.querySelector('div.surface div.mt-3.flex');
    if (!filterWrap) {
      var cands = main.querySelectorAll('div.flex.flex-wrap.gap-2');
      for (var i = 0; i < cands.length; i++) {
        if (cands[i].textContent.indexOf('الكل') !== -1) { filterWrap = cands[i]; break; }
      }
    }
    var countP = null;
    var ps = main.querySelectorAll('p.mt-5');
    if (ps.length) countP = ps[0];
    var ul = main.querySelector('ul.mt-3.grid');
    if (!input || !filterWrap || !ul) return;

    var query = '';
    var activeCat = null;
    var expanded = null; // global index

    // keep input uncontrolled by React: clone to drop React listeners
    input.setAttribute('autocomplete', 'off');

    function filtered() {
      var q = query.trim();
      return DATA.map(function (s, gi) { return { s: s, gi: gi }; }).filter(function (row) {
        var s = row.s;
        var okQ = !q || (s.name || '').indexOf(q) !== -1 || (s.church || '').indexOf(q) !== -1 ||
          (s.topics || '').indexOf(q) !== -1 || (s.phone || '').indexOf(q) !== -1;
        var okC = !activeCat || (s.topics || '').indexOf(activeCat) !== -1;
        return okQ && okC;
      });
    }

    function renderFilters() {
      filterWrap.innerHTML = '';
      var all = document.createElement('button');
      all.type = 'button';
      all.textContent = 'الكل';
      all.className = 'rounded-full px-3.5 py-1.5 text-xs font-semibold transition ' +
        (activeCat === null ? 'bg-primary text-primary-foreground' : 'bg-secondary');
      all.addEventListener('click', function () { activeCat = null; expanded = null; renderAll(); });
      filterWrap.appendChild(all);
      CATS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = c;
        b.className = 'rounded-full px-3.5 py-1.5 text-xs font-semibold transition ' +
          (activeCat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary');
        b.addEventListener('click', function () {
          activeCat = (activeCat === c ? null : c);
          expanded = null;
          renderAll();
        });
        filterWrap.appendChild(b);
      });
    }

    function renderList() {
      var rows = filtered();
      ul.innerHTML = '';
      // remove old empty-msg if any
      var oldEmpty = main.querySelector('[data-empty-msg]');
      if (oldEmpty) oldEmpty.remove();
      rows.forEach(function (row) {
        var s = row.s, gi = row.gi;
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'surface w-full rounded-3xl p-4 text-start transition hover:-translate-y-0.5';
        var head = document.createElement('div');
        head.className = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2';
        var h2 = document.createElement('h2');
        h2.className = 'truncate text-sm font-bold';
        h2.textContent = s.name;
        var num = document.createElement('span');
        num.className = 'font-mono shrink-0 text-[10px] text-muted-foreground';
        num.textContent = '#' + pad3(gi + 1);
        head.appendChild(h2); head.appendChild(num);
        var ch = document.createElement('p');
        ch.className = 'mt-1 truncate text-xs text-muted-foreground';
        ch.textContent = s.church || 'الكنيسة غير مسجّلة';
        btn.appendChild(head); btn.appendChild(ch);
        if (expanded === gi) {
          var det = document.createElement('div');
          det.className = 'animate-fade-in mt-3 space-y-2 border-t border-dashed border-border pt-3';
          var pt = document.createElement('p');
          pt.className = 'text-xs';
          var lbl = document.createElement('span');
          lbl.className = 'text-muted-foreground';
          lbl.textContent = 'المواضيع: ';
          pt.appendChild(lbl);
          pt.appendChild(document.createTextNode(s.topics || 'غير محددة'));
          det.appendChild(pt);
          if (s.phone) {
            var a = document.createElement('a');
            a.href = 'tel:' + s.phone;
            a.className = 'font-mono inline-block rounded-full bg-secondary px-3 py-1 text-xs';
            a.textContent = s.phone;
            a.addEventListener('click', function (ev) { ev.stopPropagation(); });
            det.appendChild(a);
          }
          btn.appendChild(det);
        }
        btn.addEventListener('click', function () {
          expanded = (expanded === gi ? null : gi);
          renderList();
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      if (countP) {
        countP.textContent = '';
        countP.appendChild(document.createTextNode('النتائج: ' + rows.length));
      }
      if (rows.length === 0) {
        var em = document.createElement('p');
        em.setAttribute('data-empty-msg', '1');
        em.className = 'mt-10 text-center text-sm text-muted-foreground';
        em.textContent = 'مافيش نتائج للبحث ده.';
        ul.parentNode.insertBefore(em, ul.nextSibling);
      }
    }

    function renderAll() { renderFilters(); renderList(); }

    input.addEventListener('input', function () {
      query = input.value;
      expanded = null;
      renderList();
    });
    // prevent React (if alive) from controlling value: keep focus
    renderAll();
  });
})();
