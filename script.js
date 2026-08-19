(function(){
  const menuToggle=document.getElementById('menuToggle');
  const mainNav=document.getElementById('mainNav');
  if(menuToggle&&mainNav){
    menuToggle.addEventListener('click',()=>{
      const open=mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded',String(open));
    });
    mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded','false');
    }));
  }

  document.querySelectorAll('.faq-question').forEach(button=>{
    button.addEventListener('click',()=>{
      const item=button.closest('.faq-item');
      const isOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other=>{
        other.classList.remove('open');
        other.querySelector('.faq-question').setAttribute('aria-expanded','false');
      });
      if(!isOpen){
        item.classList.add('open');
        button.setAttribute('aria-expanded','true');
      }
    });
  });

  const sections=[...document.querySelectorAll('main section[id]')];
  const links=[...document.querySelectorAll('.main-nav a[href^="#"]')];
  const updateActive=()=>{
    const y=window.scrollY+130;
    let current='inicio';
    sections.forEach(section=>{if(section.offsetTop<=y) current=section.id;});
    links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+current));
  };
  window.addEventListener('scroll',updateActive,{passive:true});
  updateActive();
})();
