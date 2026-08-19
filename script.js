(() => {
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelectorAll('.nav-links a');

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    toggle.textContent = open ? '×' : '☰';
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      toggle.textContent = '☰';
    });
  });
})();
