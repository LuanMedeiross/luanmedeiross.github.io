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

  // realce de sintaxe
  try {
    content.querySelectorAll('pre code').forEach(function (el) {
      try { hljs.highlightElement(el); } catch (e) {}
    });
  } catch (e) {}

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
