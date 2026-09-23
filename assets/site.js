document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.querySelector('.menu'), links=document.querySelector('.mobileLinks');
  if(btn&&links)btn.addEventListener('click',()=>links.classList.toggle('open'));
  document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
});