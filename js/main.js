(function () {
  var WA_NUMBER = '5511994189051';
  var WA_DEFAULT = 'Olá! Vim pelo site da Fisiobella e gostaria de agendar uma avaliação.';

  function waLink(proc) {
    var msg = proc
      ? 'Olá! Vim pelo site da Fisiobella e gostaria de saber mais sobre ' + proc + '.'
      : WA_DEFAULT;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // Links de WhatsApp (mensagem personalizada por procedimento via data-proc)
  document.querySelectorAll('.js-wa').forEach(function (a) {
    a.href = waLink(a.getAttribute('data-proc'));
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', function () {
    setNav(!document.body.classList.contains('nav-open'));
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setNav(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  // Filtro de procedimentos
  var tabs = document.querySelectorAll('.tab');
  var procs = document.querySelectorAll('.proc');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var filter = tab.getAttribute('data-filter');
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      procs.forEach(function (p) {
        p.classList.toggle('is-hidden', filter !== 'all' && p.getAttribute('data-cat') !== 'always' && p.getAttribute('data-cat') !== filter);
      });
    });
  });

  // Animação ao rolar
  var items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
