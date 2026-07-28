/* ═══════════════════════════════════════════════════════
   DSE 生物科 · 卷一A 答案搜尋器 — 邏輯
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var yearSel = $('year'), qSel = $('qno'),
      prevBtn = $('prevBtn'), nextBtn = $('nextBtn'),
      prevBtn2 = $('prevBtn2'), nextBtn2 = $('nextBtn2'),
      counter = $('counter'), warn = $('warn'),
      result  = $('result'), qLabel = $('qLabel'),
      tile    = $('tile'),   ansLetter = $('ansLetter'),
      gFill   = $('gFill'),  pctText = $('pctText'),
      diffPill= $('diffPill'), diffNote = $('diffNote'),
      concept = $('concept'), optsBox = $('opts'),
      acc     = $('acc'), accBtn = $('accBtn'), accHint = $('accHint'),
      shareBtn= $('shareBtn'), toastEl = $('toast');

  var CIRC = 2 * Math.PI * 52;

  /* ---------- guard: is the database there? ---------- */
  if (typeof DATA !== 'object' || DATA === null || !Object.keys(DATA).length) {
    warn.hidden = false;
    yearSel.disabled = qSel.disabled = prevBtn.disabled = nextBtn.disabled = true;
    revealAll();
    return;
  }

  var years = Object.keys(DATA).sort(function (a, b) { return b.localeCompare(a); });
  var qList = [];

  /* ---------- populate years ---------- */
  years.forEach(function (y) {
    var o = document.createElement('option');
    o.value = y; o.textContent = y;
    yearSel.appendChild(o);
  });

  function fillQuestions(y, keep) {
    qList = Object.keys(DATA[y]).map(Number)
              .filter(function (n) { return !isNaN(n); })
              .sort(function (a, b) { return a - b; });
    qSel.innerHTML = '';
    qList.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n; o.textContent = '第 ' + n + ' 題';
      qSel.appendChild(o);
    });
    if (keep !== null && qList.indexOf(Number(keep)) > -1) qSel.value = keep;
  }

  /* ---------- render ---------- */
  function render(scroll) {
    var y = yearSel.value, n = Number(qSel.value), q = DATA[y] && DATA[y][n];
    if (!q) return;

    result.hidden = false;
    qLabel.textContent = y + ' · 卷一A · 第 ' + n + ' 題';

    /* answer tile */
    ansLetter.textContent = q.ans;
    tile.classList.remove('flip');
    void tile.offsetWidth;
    tile.classList.add('flip');

    /* correct rate */
    if (q.pct === null || q.pct === undefined) {
      pctText.textContent = '—';
      gFill.style.strokeDashoffset = CIRC;
      diffPill.textContent = '未有公佈';
      diffPill.removeAttribute('data-l');
      diffNote.textContent = '此題未有官方公佈之答對率數據。';
    } else {
      var p = Math.round(q.pct * 100);
      pctText.textContent = p + '%';
      gFill.style.strokeDashoffset = CIRC;
      requestAnimationFrame(function () {
        gFill.style.strokeDashoffset = CIRC * (1 - p / 100);
      });
      var lv = p >= 70 ? 'easy' : p >= 50 ? 'mid' : 'hard';
      diffPill.setAttribute('data-l', lv);
      diffPill.textContent = lv === 'easy' ? '掌握理想'
                           : lv === 'mid'  ? '中等難度'
                           :                 '頗具挑戰';
      diffNote.textContent = lv === 'easy'
        ? '每 100 名考生中約有 ' + p + ' 人選出正確答案。'
        : lv === 'mid'
        ? '僅 ' + p + '% 考生答對——大約一半考生在此失分。'
        : '僅 ' + p + '% 考生答對。經典陷阱——請細閱解釋。';
    }

    concept.textContent = q.concept || '';

    /* options */
    optsBox.innerHTML = '';
    ['A', 'B', 'C', 'D'].forEach(function (L) {
      var txt = q.opts && q.opts[L];
      if (!txt) return;
      var ok = (L === q.ans);
      var d = document.createElement('div');
      d.className = 'opt' + (ok ? ' ok' : '');
      d.innerHTML = '<div class="opt-head"><span class="chip">' + L + '</span>' +
                    '<span class="status">' + (ok ? '正確答案' : '錯誤選項') +
                    '</span></div><p></p>';
      d.querySelector('p').textContent = txt;
      optsBox.appendChild(d);
    });

    closeAcc();
    popIn();

    /* nav state */
    var i = qList.indexOf(n);
    prevBtn.disabled = (i <= 0);
    nextBtn.disabled = (i === qList.length - 1);
    // keep bottom buttons in sync
    prevBtn2.disabled = (i <= 0);
    nextBtn2.disabled = (i === qList.length - 1);
    counter.textContent = '第 ' + n + ' 題（共 ' + qList[qList.length - 1] + ' 題）';
    counter2.textContent = counter.textContent;   // reuse same text
     
    localStorage.setItem('bio1a', y + '|' + n);
    history.replaceState(null, '', '#' + y + '-' + n);

    if (scroll) {
      var top = result.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function popIn() {
    var cards = result.querySelectorAll('.pop');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.remove('in');
      void cards[i].offsetWidth;
      cards[i].classList.add('in');
    }
  }

  /* ---------- accordion ---------- */
  function closeAcc() {
    acc.classList.remove('open');
    accBtn.setAttribute('aria-expanded', 'false');
    accHint.textContent = '點擊展開四個選項的詳細解釋';
  }
  accBtn.addEventListener('click', function () {
    var open = acc.classList.toggle('open');
    accBtn.setAttribute('aria-expanded', String(open));
    accHint.textContent = open ? '點擊收起' : '點擊展開四個選項的詳細解釋';
  });

  /* ---------- prev / next ---------- */
  function step(d) {
    var i = qList.indexOf(Number(qSel.value)) + d;
    if (i >= 0 && i < qList.length) { qSel.value = qList[i]; render(true); }
  }
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  prevBtn2.addEventListener('click', function () { step(-1); });   // ← add
  nextBtn2.addEventListener('click', function () { step(1); });    // ← add
   
  /* ---------- selects (no Enter needed) ---------- */
  yearSel.addEventListener('change', function () {
    fillQuestions(yearSel.value, null);
    render(true);
  });
  qSel.addEventListener('change', function () { render(true); });

  /* ---------- share ---------- */
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 2100);
  }
  shareBtn.addEventListener('click', function () {
    var y = yearSel.value, n = qSel.value;
    var payload = {
      title: 'DSE 生物科 · 卷一A',
      text: y + ' 卷一A · 第 ' + n + ' 題 — 答案 ' + DATA[y][n].ans,
      url: location.href
    };
    if (navigator.share) {
      navigator.share(payload).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href)
        .then(function () { toast('連結已複製'); })
        .catch(function () {});
    }
  });

  /* ---------- keyboard (iPad Magic Keyboard) ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target.tagName;
    if (t === 'SELECT' || t === 'INPUT') return;
    if (e.key === 'ArrowRight') { step(1);  e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { step(-1); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' ') {
      if (t !== 'BUTTON') { accBtn.click(); e.preventDefault(); }
    }
  });

  /* ---------- scroll reveal ---------- */
  function revealAll() {
  var els = document.querySelectorAll('.reveal');
  for (var i = 0; i < els.length; i++) els[i].classList.add('in');
}
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  
  // Add a small delay to ensure proper initial observation
  setTimeout(function() {
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }, 100);
} else { revealAll(); }

  /* ---------- restore state ---------- */
  var y0 = years[0], n0 = null;
  var m = (location.hash || '').match(/^#(\d{4})-(\d+)$/);
  // Only restore from URL hash, not localStorage
  if (m && DATA[m[1]] && DATA[m[1]][m[2]]) { 
    y0 = m[1]; 
    n0 = m[2]; 
    yearSel.value = y0;
    fillQuestions(y0, n0);
    render(false);
  } else {
    // First visit: just populate dropdowns, don't show result
    yearSel.value = y0;
    fillQuestions(y0, null);
    result.hidden = true;
  }
})();
