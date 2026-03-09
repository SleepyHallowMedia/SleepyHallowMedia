/* Sleepy Hallow Media — effects.js (v1.2)
   Adds surreal/interactive touches without altering script.js:
   - Inject price/issue sticker on the home lead (from <html data-*>).
   - Spotlight hover over the lead headline area.
   - Reveal-on-scroll for cards/right-rail.
   - Article scroll "barcode" progress.
*/
(function(){
  'use strict';

  const doc = document;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $$ = (sel, root = doc) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = doc) => root.querySelector(sel);

  function idle(fn){ (window.requestIdleCallback || window.requestAnimationFrame)(fn); }

  /* ---------- Lead: price/issue sticker ---------- */
  function injectPriceSticker(){
    const host = $('#lead-story');
    if(!host || host.querySelector('.price-sticker')) return;

    const carrier = document.documentElement;
    const price  = carrier.dataset.price  || '';
    const season = carrier.dataset.season || '';
    const issue  = carrier.dataset.issue  || '';

    if(!price && !season && !issue) return;

    const el = doc.createElement('div');
    el.className = 'price-sticker';
    el.setAttribute('role', 'note');
    el.setAttribute('aria-label', 'Issue information');
    el.innerHTML = `
      <div class="ps-line1">${[season, issue].filter(Boolean).join(' • ')}</div>
      ${price ? `<div class="ps-price">${price}</div>` : ''}
      <div class="ps-barcode" aria-hidden="true"></div>
    `;
    host.appendChild(el);
  }

  /* ---------- Lead: spotlight hover ---------- */
  function spotlightLead(){
    if(prefersReduced) return;
    const leadBody = $('.lead-card .lead-body');
    if(!leadBody) return;

    let raf = 0, x = 0, y = 0;
    const apply = () => {
      raf = 0;
      leadBody.style.setProperty('--spot-x', x + 'px');
      leadBody.style.setProperty('--spot-y', y + 'px');
    };
    const onMove = (e) => {
      const r = leadBody.getBoundingClientRect();
      x = Math.max(0, Math.min(e.clientX - r.left, r.width));
      y = Math.max(0, Math.min(e.clientY - r.top, r.height));
      if(!raf) raf = requestAnimationFrame(apply);
    };
    leadBody.addEventListener('mousemove', onMove, {passive:true});
    leadBody.addEventListener('mouseleave', () => {
      leadBody.style.removeProperty('--spot-x');
      leadBody.style.removeProperty('--spot-y');
    }, {passive:true});
  }

  /* ---------- Reveal-on-scroll ---------- */
  function revealOnScroll(){
    const targets = $$('.cards-grid .card, .top-card');
    if(!targets.length) return;
    targets.forEach(t => t.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      for(const it of entries){
        if(it.isIntersecting){
          it.target.classList.add('is-revealed');
          io.unobserve(it.target);
        }
      }
    }, {rootMargin: '100px 0px'});
    targets.forEach(t => io.observe(t));
  }

  /* ---------- Article: scroll barcode progress ---------- */
  function articleBarcode(){
    const wrap = $('.article-wrap');
    if(!wrap) return;

    // mount if not present
    let bar = $('.scroll-barcode');
    if(!bar){
      bar = doc.createElement('div');
      bar.className = 'scroll-barcode';
      wrap.prepend(bar);
    }

    const update = () => {
      const el = $('.article-body');
      if(!el) return;
      const r = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const sc = Math.min(Math.max(window.scrollY - (el.offsetTop - 64), 0), total);
      const pct = total > 0 ? (sc/total)*100 : 0;
      bar.style.setProperty('--progress', pct.toFixed(2) + '%');
    };
    update();
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update, {passive:true});
  }

  /* ---------- bootstrap after content exists ---------- */
  function enhanceHome(){
    const lead = $('#lead-story');
    if(!lead) return;
    if(lead.children.length){
      injectPriceSticker(); spotlightLead(); revealOnScroll();
      return;
    }
    // wait for script.js to populate
    const mo = new MutationObserver(() => {
      if(lead.children.length){
        mo.disconnect();
        injectPriceSticker(); spotlightLead(); revealOnScroll();
      }
    });
    mo.observe(lead, {childList:true, subtree:false});
    setTimeout(()=>{ try{ mo.disconnect(); }catch{} }, 3500);
  }

  function enhanceArticle(){
    // if article page, mount barcode after DOM ready
    if($('.article-wrap')) articleBarcode();
  }

  document.addEventListener('DOMContentLoaded', () => {
    idle(enhanceHome);
    idle(enhanceArticle);
  });
})();