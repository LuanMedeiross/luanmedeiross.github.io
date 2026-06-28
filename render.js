// Renderiza o Markdown inline de uma parte e monta o índice lateral (sem fatiar capítulo).
(function () {
  var md = document.getElementById('md');
  var content = document.getElementById('content');
  if (!md || !content) return;

  try {
    content.innerHTML = DOMPurify.sanitize(marked.parse(md.textContent));
  } catch (e) {
    content.textContent = md.textContent;
    return;
  }

  // abas de linguagem: um bloco python seguido de um javascript vira abas
  // sincronizadas; a escolha do leitor fica salva entre os capítulos.
  try { buildCodeTabs(); } catch (e) {}

  // realce de sintaxe (inclui os blocos escondidos dentro das abas)
  try {
    content.querySelectorAll('pre code').forEach(function (el) {
      try { hljs.highlightElement(el); } catch (e) {}
    });
  } catch (e) {}

  function buildCodeTabs() {
    var LANGS = ['python', 'javascript'];
    var LABEL = { python: 'Python', javascript: 'JavaScript' };
    var KEY = 'pref-lang';
    function pref() {
      try { var v = localStorage.getItem(KEY); return LANGS.indexOf(v) >= 0 ? v : 'python'; }
      catch (e) { return 'python'; }
    }
    function langOf(pre) {
      var c = pre.querySelector('code');
      var m = c && c.className.match(/language-(\w+)/);
      return m ? m[1] : null;
    }
    var taken = [];
    [].slice.call(content.querySelectorAll('pre')).forEach(function (pre) {
      if (taken.indexOf(pre) >= 0 || langOf(pre) !== 'python') return;
      var variants = { python: pre };
      var sib = pre.nextElementSibling;
      while (sib && sib.tagName === 'PRE') {
        var l = langOf(sib);
        if (l && LANGS.indexOf(l) >= 0 && !variants[l]) { variants[l] = sib; taken.push(sib); sib = sib.nextElementSibling; }
        else break;
      }
      if (!variants.javascript) return;          // só python: deixa o bloco como está
      var box = document.createElement('div');
      box.className = 'code-tabs';
      var head = document.createElement('div');
      head.className = 'code-tabs-head';
      box.appendChild(head);
      pre.parentNode.insertBefore(box, pre);
      LANGS.forEach(function (l) {
        if (!variants[l]) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-tab';
        btn.setAttribute('data-lang', l);
        btn.textContent = LABEL[l];
        head.appendChild(btn);
        variants[l].setAttribute('data-lang', l);
        box.appendChild(variants[l]);
      });
    });

    function apply(p) {
      content.querySelectorAll('.code-tabs').forEach(function (box) {
        var show = box.querySelector('pre[data-lang="' + p + '"]') ? p : 'python';
        box.querySelectorAll('pre[data-lang]').forEach(function (pre) {
          pre.style.display = pre.getAttribute('data-lang') === show ? '' : 'none';
        });
        box.querySelectorAll('.code-tab').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-lang') === show);
        });
      });
    }
    content.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.code-tab') : null;
      if (!btn) return;
      var p = btn.getAttribute('data-lang');
      try { localStorage.setItem(KEY, p); } catch (e2) {}
      apply(p);
    });
    apply(pref());
  }

  function slug(t) {
    return ((t || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/\s+/g, '-')) || 's';
  }

  var toc = document.getElementById('toc');
  if (toc) {
    var used = {};
    var heads = content.querySelectorAll('h2, h3');
    heads.forEach(function (h) {
      var id = slug(h.textContent);
      if (used[id]) { id += '-' + (++used[id]); } else { used[id] = 1; }
      h.id = id;
      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.className = (h.tagName === 'H3') ? 'lvl-3' : 'lvl-2';
      toc.appendChild(a);
    });

    // destaque do item ativo conforme o scroll
    var links = {};
    toc.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    try {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            for (var k in links) links[k].classList.remove('active');
            if (links[en.target.id]) links[en.target.id].classList.add('active');
          }
        });
      }, { rootMargin: '-70px 0px -75% 0px' });
      heads.forEach(function (h) { obs.observe(h); });
    } catch (e) {}
  }

  // deep-link entre páginas: rola até a âncora depois que os ids foram montados
  try {
    if (location.hash) {
      var tgt = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (tgt) tgt.scrollIntoView();
    }
  } catch (e) {}

  var h1 = content.querySelector('h1');
  if (h1) document.title = h1.textContent + ' — scraping';
})();
