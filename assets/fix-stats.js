(function () {
  'use strict';
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  var CATS = ['روحي', 'نفسي', 'اجتماعي', 'ترفيهي'];

  onReady(function () {
    if (!window.APP_STAGES) return;
    var STAGES = window.APP_STAGES;
    var META = window.APP_MONTHS || {};
    var COLORS = window.APP_COLORS || {};
    var categorize = window.APP_categorize || function () { return 'روحي'; };

    var main = document.querySelector('main.mx-auto.max-w-6xl');
    if (!main) return;
    if (main.getAttribute('data-vanilla-stats') === '1') return;
    main.setAttribute('data-vanilla-stats', '1');

    var filterWrap = null;
    var wraps = main.querySelectorAll('div.flex.flex-wrap.gap-2');
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i].textContent.indexOf('كل السنة') !== -1) { filterWrap = wraps[i]; break; }
    }
    if (!filterWrap && wraps.length) filterWrap = wraps[0];
    var headP = main.querySelector('header p.mt-3');
    var cardsSec = main.querySelector('section.mt-6.grid');
    var monthSec = main.querySelectorAll('section.surface.mt-6')[0];
    if (!filterWrap || !cardsSec || !monthSec) return;
    var monthList = monthSec.querySelector('div.mt-5.space-y-3');

    var sel = 'all';

    function sessions() {
      var arr = sel === 'all' ? STAGES : [STAGES[sel]];
      var out = [];
      arr.forEach(function (st) {
        st.months.forEach(function (m) {
          m.sessions.forEach(function (s) { out.push(s); });
        });
      });
      return out;
    }
    function monthRows() {
      var arr = sel === 'all' ? STAGES : [STAGES[sel]];
      var rows = [];
      arr.forEach(function (st) {
        st.months.forEach(function (m) {
          var counts = CATS.map(function (c) {
            return m.sessions.filter(function (s) { return categorize(s.topic) === c; }).length;
          });
          rows.push({ key: m.month, label: (META[m.month] && META[m.month].label) || m.month, counts: counts, total: m.sessions.length });
        });
      });
      return rows;
    }

    function renderFilters() {
      filterWrap.innerHTML = '';
      function mk(label, val, active) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.className = 'rounded-full px-5 py-2 text-sm font-semibold transition ' +
          (active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card/70');
        b.addEventListener('click', function () { sel = val; renderAll(); });
        return b;
      }
      filterWrap.appendChild(mk('كل السنة', 'all', sel === 'all'));
      STAGES.forEach(function (st, idx) {
        var short = String(st.title).split(' - ');
        short = short.length > 1 ? short[1] : st.title;
        filterWrap.appendChild(mk(short, idx, sel === idx));
      });
    }

    function renderCards() {
      var list = sessions();
      var total = list.length || 1;
      cardsSec.innerHTML = '';
      CATS.forEach(function (c) {
        var n = list.filter(function (s) { return categorize(s.topic) === c; }).length;
        var pct = Math.round(n / total * 100);
        var card = document.createElement('div');
        card.className = 'surface rounded-3xl p-5';
        var top = document.createElement('div');
        top.className = 'flex items-center justify-between';
        var nm = document.createElement('span');
        nm.className = 'text-sm font-bold'; nm.textContent = c;
        var dot = document.createElement('span');
        dot.className = 'h-3 w-3 rounded-full';
        dot.style.backgroundColor = COLORS[c] || '#888';
        top.appendChild(nm); top.appendChild(dot);
        var big = document.createElement('p');
        big.className = 'font-display mt-3 text-4xl font-black';
        big.textContent = String(n);
        var track = document.createElement('div');
        track.className = 'mt-3 h-2 overflow-hidden rounded-full bg-secondary';
        var bar = document.createElement('div');
        bar.className = 'h-full rounded-full transition-all duration-700';
        bar.style.width = (n / total * 100) + '%';
        bar.style.backgroundColor = COLORS[c] || '#888';
        track.appendChild(bar);
        var sub = document.createElement('p');
        sub.className = 'mt-2 font-mono text-xs text-muted-foreground';
        sub.textContent = pct + '% من اللقاءات';
        card.appendChild(top); card.appendChild(big); card.appendChild(track); card.appendChild(sub);
        cardsSec.appendChild(card);
      });
      if (headP) {
        var rows = monthRows();
        var suffix = sel === 'all' ? '12 شهر وأربع مراحل.' : (rows.length + ' شهر.');
        headP.textContent = list.length + ' لقاء موزّعين على ' + suffix;
      }
    }

    function renderMonths() {
      if (!monthList) return;
      monthList.innerHTML = '';
      monthRows().forEach(function (r) {
        var row = document.createElement('div');
        row.className = 'grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-3';
        var lab = document.createElement('span');
        lab.className = 'truncate text-xs font-semibold';
        lab.textContent = r.label;
        var bar = document.createElement('div');
        bar.className = 'flex h-6 overflow-hidden rounded-full bg-secondary';
        r.counts.forEach(function (n, ci) {
          if (!n) return;
          var seg = document.createElement('div');
          seg.className = 'transition-all duration-700';
          seg.title = CATS[ci] + ': ' + n;
          seg.style.width = (n / (r.total || 1) * 100) + '%';
          seg.style.backgroundColor = COLORS[CATS[ci]] || '#888';
          bar.appendChild(seg);
        });
        var tot = document.createElement('span');
        tot.className = 'font-mono text-xs text-muted-foreground';
        tot.textContent = String(r.total);
        row.appendChild(lab); row.appendChild(bar); row.appendChild(tot);
        monthList.appendChild(row);
      });
    }

    function renderAll() { renderFilters(); renderCards(); renderMonths(); }
    renderAll();
  });
})();
