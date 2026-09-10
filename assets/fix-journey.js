(function () {
  'use strict';
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getParam(name) {
    try {
      var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) { return null; }
  }

  onReady(function () {
    if (!window.APP_STAGES || !window.APP_MONTHS) return;
    var STAGES = window.APP_STAGES;
    var META = window.APP_MONTHS;
    var COLORS = window.APP_COLORS || {};
    var categorize = window.APP_categorize || function () { return 'روحي'; };
    var fmtDate = window.APP_formatDate || function (d) { return d; };

    var main = document.querySelector('main.mx-auto.max-w-6xl');
    if (!main) return;
    if (main.getAttribute('data-vanilla-journey') === '1') return;
    main.setAttribute('data-vanilla-journey', '1');

    var divs = main.querySelectorAll(':scope > div.flex.flex-wrap.gap-2');
    // fallback: any direct flex wraps (stage + months)
    if (divs.length < 2) {
      var all = main.querySelectorAll('div.flex.flex-wrap.gap-2');
      divs = all;
    }
    var stageWrap = divs[0];
    var monthWrap = null;
    for (var k = 0; k < divs.length; k++) {
      if (divs[k].className.indexOf('mt-6') !== -1) monthWrap = divs[k];
    }
    if (!monthWrap && divs.length > 1) monthWrap = divs[1];
    var grid = main.querySelector('div.mt-8.grid');
    if (!stageWrap || !monthWrap || !grid) return;
    var sessSection = grid.querySelector('section.surface');
    var aside = grid.querySelector('aside');
    if (!sessSection || !aside) return;

    var stageIdx = parseInt(getParam('stage') || '0', 10);
    if (isNaN(stageIdx) || stageIdx < 0 || stageIdx >= STAGES.length) stageIdx = 0;
    var monthKey = getParam('month');
    if (!monthKey || !STAGES[stageIdx].months.some(function (m) { return m.month === monthKey; })) {
      monthKey = STAGES[stageIdx].months[0].month;
    }

    // per-month UI state (kept across re-renders in memory)
    var mirrorVals = {};   // monthKey -> string[]
    var sortOrders = {};   // monthKey -> string[]
    var balanceVals = {};  // monthKey -> number[]
    var quizAnswers = {};  // monthKey -> {qi: oi}
    var openCards = {};    // monthKey -> bool[]

    function shortTitle(t) {
      var p = String(t).split(' - ');
      return p.length > 1 ? p[1] : t;
    }

    function renderStages() {
      stageWrap.innerHTML = '';
      STAGES.forEach(function (st, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = st.title;
        b.className = 'rounded-full px-5 py-2 text-sm font-semibold transition ' +
          (i === stageIdx ? 'bg-primary text-primary-foreground' : 'border border-border bg-card/70 hover:-translate-y-0.5');
        b.addEventListener('click', function () {
          if (stageIdx === i) return;
          stageIdx = i;
          monthKey = STAGES[stageIdx].months[0].month;
          renderAll();
        });
        stageWrap.appendChild(b);
      });
    }

    function renderMonths() {
      monthWrap.innerHTML = '';
      var months = STAGES[stageIdx].months;
      months.forEach(function (m) {
        var meta = META[m.month] || {};
        var active = m.month === monthKey;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rounded-2xl px-5 py-3 text-start transition ' +
          (active ? 'surface -translate-y-0.5 ring-1 ring-ring' : 'border border-border bg-card/50 hover:bg-card');
        var s1 = document.createElement('span');
        s1.className = 'block text-sm font-bold';
        s1.textContent = meta.label || m.month;
        var s2 = document.createElement('span');
        s2.className = 'font-mono block text-[11px] text-muted-foreground';
        s2.textContent = m.month + ' · ' + m.sessions.length + ' لقاء';
        b.appendChild(s1); b.appendChild(s2);
        b.addEventListener('click', function () {
          if (monthKey === m.month) return;
          monthKey = m.month;
          renderAll();
        });
        monthWrap.appendChild(b);
      });
    }

    function renderSessions() {
      var st = STAGES[stageIdx];
      var cur = st.months.filter(function (m) { return m.month === monthKey; })[0] || st.months[0];
      var meta = META[cur.month] || {};
      // clear section
      sessSection.innerHTML = '';
      var top = document.createElement('div');
      top.className = 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3';
      var left = document.createElement('div');
      left.className = 'min-w-0';
      var h2 = document.createElement('h2');
      h2.className = 'font-display text-xl font-bold sm:text-2xl';
      h2.textContent = (meta.label || cur.month) + ' — ' + cur.month;
      var p = document.createElement('p');
      p.className = 'mt-1 text-sm text-muted-foreground';
      p.textContent = meta.theme || '';
      left.appendChild(h2); left.appendChild(p);
      var badge = document.createElement('span');
      badge.className = 'font-mono shrink-0 rounded-full bg-secondary px-3 py-1 text-[11px]';
      badge.textContent = shortTitle(st.title);
      top.appendChild(left); top.appendChild(badge);
      sessSection.appendChild(top);

      var ul = document.createElement('ul');
      ul.className = 'mt-5 space-y-3';
      cur.sessions.forEach(function (s) {
        var cat = categorize(s.topic);
        var li = document.createElement('li');
        li.className = 'rounded-2xl border border-border bg-card/60 p-4 transition hover:-translate-y-0.5';
        var row = document.createElement('div');
        row.className = 'flex flex-wrap items-center justify-between gap-2';
        var d = document.createElement('span');
        d.className = 'font-mono text-xs text-muted-foreground';
        d.textContent = fmtDate(s.date);
        var c = document.createElement('span');
        c.className = 'rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white';
        c.style.backgroundColor = COLORS[cat] || '#666';
        c.textContent = cat;
        row.appendChild(d); row.appendChild(c);
        var t = document.createElement('p');
        t.className = 'mt-2 text-sm font-semibold leading-relaxed';
        t.textContent = s.topic;
        li.appendChild(row); li.appendChild(t);
        ul.appendChild(li);
      });
      sessSection.appendChild(ul);
    }

    // ---- experiences ----
    function cardShell(title, note) {
      var box = document.createElement('div');
      box.className = 'surface rounded-3xl p-5 sm:p-6';
      var h = document.createElement('h4');
      h.className = 'font-display text-base font-bold sm:text-lg';
      h.textContent = title;
      var n = document.createElement('p');
      n.className = 'mt-1 text-xs text-muted-foreground';
      n.textContent = note;
      var body = document.createElement('div');
      body.className = 'mt-4';
      box.appendChild(h); box.appendChild(n); box.appendChild(body);
      return { box: box, body: body };
    }

    function renderMirror(body, exp) {
      if (!mirrorVals[monthKey]) mirrorVals[monthKey] = exp.prompts.map(function () { return ''; });
      var vals = mirrorVals[monthKey];
      var list = document.createElement('div');
      list.className = 'space-y-3';
      exp.prompts.forEach(function (pr, i) {
        var w = document.createElement('div');
        var lab = document.createElement('label');
        lab.className = 'block text-sm font-medium';
        lab.textContent = pr;
        var ta = document.createElement('textarea');
        ta.rows = 2;
        ta.className = 'mt-1.5 w-full resize-none rounded-2xl border border-border bg-card/70 p-3 text-sm outline-none transition focus:border-ring';
        ta.placeholder = 'اكتب هنا…';
        ta.value = vals[i] || '';
        ta.addEventListener('input', function () {
          vals[i] = ta.value;
          updateHint();
        });
        w.appendChild(lab); w.appendChild(ta);
        list.appendChild(w);
      });
      var hint = document.createElement('div');
      hint.className = 'mt-4 rounded-2xl bg-secondary p-4 text-sm';
      function updateHint() {
        var n = vals.filter(function (v) { return v.trim().length > 2; }).length;
        hint.innerHTML = '';
        if (n === 0) hint.textContent = 'المرايا لسه فاضية… جرّب تكتب حاجة واحدة بصراحة.';
        else if (n < exp.prompts.length) hint.textContent = 'كتبت ' + n + ' من ' + exp.prompts.length + '. كمّل.';
        else {
          var s = document.createElement('span');
          s.className = 'font-semibold';
          s.textContent = 'اللي كتبته دلوقتي هو صورتك في عينك. الرحلة كلها إنك تشوف صورتك في عين الله.';
          hint.appendChild(s);
        }
      }
      updateHint();
      body.appendChild(list); body.appendChild(hint);
    }

    function renderSort(body, exp) {
      if (!sortOrders[monthKey]) sortOrders[monthKey] = exp.items.slice();
      var items = sortOrders[monthKey];
      var ol = document.createElement('ol');
      ol.className = 'space-y-2';
      function draw() {
        ol.innerHTML = '';
        items.forEach(function (name, idx) {
          var li = document.createElement('li');
          li.className = 'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-border bg-card/70 px-3 py-2';
          var num = document.createElement('span');
          num.className = 'font-mono text-xs text-muted-foreground';
          num.textContent = String(idx + 1);
          var nm = document.createElement('span');
          nm.className = 'truncate text-sm font-medium';
          nm.textContent = name;
          var ctl = document.createElement('span');
          ctl.className = 'flex shrink-0 gap-1';
          var up = document.createElement('button');
          up.type = 'button'; up.textContent = '↑'; up.setAttribute('aria-label', 'فوق');
          up.className = 'grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs transition hover:bg-primary hover:text-primary-foreground';
          up.addEventListener('click', function () {
            if (idx <= 0) return;
            var t = items[idx - 1]; items[idx - 1] = items[idx]; items[idx] = t;
            draw();
          });
          var dn = document.createElement('button');
          dn.type = 'button'; dn.textContent = '↓'; dn.setAttribute('aria-label', 'تحت');
          dn.className = 'grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs transition hover:bg-primary hover:text-primary-foreground';
          dn.addEventListener('click', function () {
            if (idx >= items.length - 1) return;
            var t = items[idx + 1]; items[idx + 1] = items[idx]; items[idx] = t;
            draw();
          });
          ctl.appendChild(up); ctl.appendChild(dn);
          li.appendChild(num); li.appendChild(nm); li.appendChild(ctl);
          ol.appendChild(li);
        });
      }
      draw();
      var foot = document.createElement('p');
      foot.className = 'mt-4 rounded-2xl bg-secondary p-4 text-sm';
      foot.textContent = 'أول حاجة في الليستة هي اللي بتشكّل قراراتك. لو مش مرتاح لمكانها… ده أول تغيير.';
      body.appendChild(ol); body.appendChild(foot);
    }

    function renderBalance(body, exp) {
      if (!balanceVals[monthKey]) balanceVals[monthKey] = exp.axes.map(function () { return 5; });
      var vals = balanceVals[monthKey];
      var wrap = document.createElement('div');
      wrap.className = 'space-y-4';
      var msg = document.createElement('p');
      msg.className = 'mt-4 rounded-2xl bg-secondary p-4 text-sm';
      function feedback() {
        var sum = vals.reduce(function (a, b) { return a + b; }, 0);
        if (sum > exp.axes.length * 7) msg.textContent = 'الميزان مليان — خلي بالك من الاحتراق، الثبات محتاج مساحة راحة.';
        else if (sum < exp.axes.length * 3) msg.textContent = 'الميزان خفيف جدًا — اختار عادة واحدة بس تبدأ بيها الأسبوع الجاي.';
        else msg.textContent = 'ميزان متوسط: أقوى نقطة ابنِ عليها، وأضعف نقطة زودها 10٪ بس.';
      }
      exp.axes.forEach(function (ax, i) {
        var row = document.createElement('div');
        var head = document.createElement('div');
        head.className = 'flex items-center justify-between text-sm';
        var a = document.createElement('span'); a.className = 'font-medium'; a.textContent = ax;
        var v = document.createElement('span'); v.className = 'font-mono text-xs text-muted-foreground'; v.textContent = String(vals[i]);
        head.appendChild(a); head.appendChild(v);
        var inp = document.createElement('input');
        inp.type = 'range'; inp.min = '0'; inp.max = '10'; inp.value = String(vals[i]);
        inp.className = 'mt-1 w-full accent-[oklch(0.31_0.06_258)]';
        inp.addEventListener('input', function () {
          vals[i] = Number(inp.value);
          v.textContent = inp.value;
          bar.style.width = (vals[i] * 10) + '%';
          feedback();
        });
        var track = document.createElement('div');
        track.className = 'mt-1 h-1.5 overflow-hidden rounded-full bg-secondary';
        var bar = document.createElement('div');
        bar.className = 'h-full rounded-full bg-primary transition-all';
        bar.style.width = (vals[i] * 10) + '%';
        track.appendChild(bar);
        row.appendChild(head); row.appendChild(inp); row.appendChild(track);
        wrap.appendChild(row);
      });
      feedback();
      body.appendChild(wrap); body.appendChild(msg);
    }

    function renderQuiz(body, exp) {
      if (!quizAnswers[monthKey]) quizAnswers[monthKey] = {};
      var ans = quizAnswers[monthKey];
      var wrap = document.createElement('div');
      wrap.className = 'space-y-5';
      exp.questions.forEach(function (q, qi) {
        var box = document.createElement('div');
        var title = document.createElement('p');
        title.className = 'text-sm font-semibold';
        title.textContent = q.q;
        var opts = document.createElement('div');
        opts.className = 'mt-2 flex flex-wrap gap-2';
        var fb = document.createElement('p');
        fb.className = 'animate-fade-in mt-2 rounded-2xl bg-secondary p-3 text-sm';
        fb.style.display = ans[qi] === undefined ? 'none' : '';
        function paint() {
          opts.innerHTML = '';
          q.options.forEach(function (op, oi) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = op;
            var on = ans[qi] === oi;
            b.className = 'rounded-full border px-4 py-1.5 text-sm transition ' +
              (on ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card/70 hover:bg-secondary');
            b.addEventListener('click', function () {
              ans[qi] = oi;
              paint();
            });
            opts.appendChild(b);
          });
          if (ans[qi] !== undefined) {
            fb.style.display = '';
            fb.textContent = (ans[qi] === q.answer ? 'قريب جدًا. ' : 'فكّر تاني: ') + q.why;
          } else fb.style.display = 'none';
        }
        paint();
        box.appendChild(title); box.appendChild(opts); box.appendChild(fb);
        wrap.appendChild(box);
      });
      body.appendChild(wrap);
    }

    function renderClues(body, exp) {
      if (!openCards[monthKey]) openCards[monthKey] = [];
      var open = openCards[monthKey];
      var grid2 = document.createElement('div');
      grid2.className = 'grid gap-3 sm:grid-cols-2';
      exp.cards.forEach(function (card, i) {
        var b = document.createElement('button');
        b.type = 'button';
        function paint() {
          var on = open.indexOf(i) !== -1;
          b.className = 'min-h-24 rounded-2xl border p-4 text-right transition-all duration-300 ' +
            (on ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card/70 hover:-translate-y-0.5');
          b.innerHTML = '';
          var f = document.createElement('span');
          f.className = 'block text-xs opacity-70';
          f.textContent = card.front;
          var bk = document.createElement('span');
          bk.className = 'mt-1 block text-sm font-semibold';
          bk.textContent = on ? card.back : 'اضغط للكشف';
          b.appendChild(f); b.appendChild(bk);
        }
        b.addEventListener('click', function () {
          var at = open.indexOf(i);
          if (at === -1) open.push(i); else open.splice(at, 1);
          paint();
        });
        paint();
        grid2.appendChild(b);
      });
      body.appendChild(grid2);
    }

    function renderExperience() {
      aside.innerHTML = '';
      var st = STAGES[stageIdx];
      var cur = st.months.filter(function (m) { return m.month === monthKey; })[0] || st.months[0];
      var meta = META[cur.month];
      if (!meta || !meta.experience) return;
      var exp = meta.experience;
      var s = cardShell(exp.title, exp.note);
      if (exp.kind === 'mirror') renderMirror(s.body, exp);
      else if (exp.kind === 'sort') renderSort(s.body, exp);
      else if (exp.kind === 'balance') renderBalance(s.body, exp);
      else if (exp.kind === 'quiz') renderQuiz(s.body, exp);
      else if (exp.kind === 'clues') renderClues(s.body, exp);
      aside.appendChild(s.box);
    }

    function renderAll() {
      renderStages();
      renderMonths();
      renderSessions();
      renderExperience();
    }
    renderAll();
  });
})();
