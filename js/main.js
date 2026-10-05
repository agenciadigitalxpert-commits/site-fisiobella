(function () {
  var WA_NUMBER = '5511994189051';
  var WA_DEFAULT = 'Olá! Vim pelo site da Fisiobella e gostaria de agendar uma avaliação.';

  // Opcional: URL que recebe os dados do formulário (ex.: Google Apps Script ligado a uma planilha).
  // Vazio = os dados só seguem na mensagem do WhatsApp.
  var LEAD_ENDPOINT = '';

  function waLink(proc, nome) {
    var ola = nome ? 'Olá! Meu nome é ' + nome + '. ' : 'Olá! ';
    var msg = proc && proc !== 'Avaliação geral'
      ? ola + 'Vim pelo site da Fisiobella e gostaria de saber mais sobre ' + proc + '.'
      : (nome ? ola + 'Vim pelo site da Fisiobella e gostaria de agendar uma avaliação.' : WA_DEFAULT);
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // Formulário curto antes do WhatsApp
  var modal = document.getElementById('lead-modal');
  var form = document.getElementById('lead-form');
  var erro = document.getElementById('lead-error');
  var origem = null; // botão que abriu o formulário
  var ultimoFoco = null;

  function posicaoBotao(a) {
    if (!a) return 'pagina';
    if (a.classList.contains('wa-float')) return 'botao-flutuante';
    var secao = a.closest('section[id], header, footer');
    return secao ? (secao.id || secao.tagName.toLowerCase()) : 'pagina';
  }

  function abrirForm(a) {
    origem = a;
    ultimoFoco = document.activeElement;
    var proc = a.getAttribute('data-proc') || 'Avaliação geral';
    var sel = form.elements.procedimento;
    sel.value = proc;
    if (sel.value !== proc) sel.value = 'Avaliação geral';
    erro.textContent = '';
    modal.hidden = false;
    document.body.classList.add('lead-open');
    form.elements.nome.focus();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'abriu_formulario', procedimento: proc, posicao_botao: posicaoBotao(a) });
  }

  function fecharForm() {
    modal.hidden = true;
    document.body.classList.remove('lead-open');
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  function mascaraTelefone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  document.querySelectorAll('.js-wa').forEach(function (a) {
    // Sem JavaScript o link continua indo direto para o WhatsApp
    a.href = waLink(a.getAttribute('data-proc'));
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      abrirForm(a);
    });
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', fecharForm);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) fecharForm();
  });

  form.elements.telefone.addEventListener('input', function () {
    this.value = mascaraTelefone(this.value);
  });
  [form.elements.nome, form.elements.telefone].forEach(function (el) {
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid')) {
        el.removeAttribute('aria-invalid');
        erro.textContent = '';
      }
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nomeEl = form.elements.nome, telEl = form.elements.telefone;
    var nome = nomeEl.value.trim().replace(/\s+/g, ' ');
    var tel = telEl.value.replace(/\D/g, '');
    var proc = form.elements.procedimento.value;
    nomeEl.removeAttribute('aria-invalid');
    telEl.removeAttribute('aria-invalid');
    if (nome.length < 2) {
      erro.textContent = 'Digite seu nome.';
      nomeEl.setAttribute('aria-invalid', 'true');
      nomeEl.focus();
      return;
    }
    if (tel.length < 10) {
      erro.textContent = 'Digite seu WhatsApp com DDD.';
      telEl.setAttribute('aria-invalid', 'true');
      telEl.focus();
      return;
    }
    erro.textContent = '';
    var primeiroNome = nome.split(' ')[0];

    // Evento para o GTM (conversão). Conta no máximo uma vez por visita.
    var jaContou = false;
    try {
      jaContou = !!sessionStorage.getItem('fb_wa_click');
      sessionStorage.setItem('fb_wa_click', '1');
    } catch (err) {
      jaContou = !!window.__fbWaClick;
      window.__fbWaClick = true;
    }
    if (!jaContou) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'clique_whatsapp', procedimento: proc, posicao_botao: posicaoBotao(origem) });
    }

    if (LEAD_ENDPOINT && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(LEAD_ENDPOINT, JSON.stringify({
          nome: nome, telefone: tel, procedimento: proc, pagina: location.href, data: new Date().toISOString()
        }));
      } catch (err) { /* não impede o WhatsApp */ }
    }

    var url = waLink(proc, primeiroNome);
    var win = window.open(url, '_blank');
    if (win) win.opener = null;
    else location.href = url; // pop-up bloqueado: abre na mesma aba
    fecharForm();
    form.reset();
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
