/* Sleepy Hallow Media — effects.js (v1.0)
   Lightweight interactivity layered on top of script.js (no dependencies).
   - Injects price/issue sticker on lead using data attributes.
   - Spotlight hover on lead.
   - Reveal-on-scroll for cards and right-rail items.
*/
(function(){
  'use strict';

  const doc = document;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onceIdle(fn){ (window.requestIdleCallback || window.requestAnimationFrame)(fn); }

  function injectPriceSticker(){
    const host = doc.getElementById('lead-story');
    if(!host || host.querySelector('.price-sticker')) return;

    // Read data attributes from <html> (or <body> fallback)
    const carrier = doc.documentElement.dataset && (doc.documentElement.dataset.price || doc.documentElement.dataset.issue)
      ? doc.documentElement
      : (doc.body || doc.documentElement);

    const price = carrier.dataset.price || '';
    const season = carrier.dataset.season || '';
    const issue = carrier.dataset.issue || '';

    if(!price && !season && !issue) return; // nothing to show

    const el = doc.createElement('div');
    el.className = 'price-sticker';
    el.setAttribute('aria-label', 'Issue information');

    // Build content similar to the magazine: season/issue line, price, barcode
    el.innerHTML = `
      <div class="ps-line1">${season ? season : ''}${season && issue ? ' • ' : ''}${issue ? issue : ''}</div>
      ${price ? `<div class="ps-price">${price}</div>` : ''}
      <div class="ps-barcode" aria-hidden="true"></div>
    `;
    host.appendChild(el);
  }

  function spotlightLead(){
    const lead = doc.querySelector('.lead-card .lead-body');
    if(!lead || prefersReduced) return;

    let raf = 0, x = 0, y = 0;
    const apply = () => {
      raf = 0;
      lead.style.setProperty('--spot-x', x + 'px');
      lead.style.setProperty('--spot-y', y + 'px');
    };
    const onMove = (e) => {
      const r = lead.getBoundingClientRect();
      x = Math.max(0, Math.min(e.clientX - r.left, r.width));
      y = Math.max(0, Math.min(e.clientY - r.top, r.height));
      if(!raf) raf = requestAnimationFrame(apply);
    };
    lead.addEventListener('mousemove', onMove, {passive:true});
    lead.addEventListener('mouseleave', () => {
      lead.style.removeProperty('--spot-x');
      lead.style.removeProperty('--spot-y');
    }, {passive:true});
  }

  function revealOnScroll(){
    const targets = [...doc.querySelectorAll('.cards-grid .card, .top-card')];
    if(!targets.length) return;
    targets.forEach(t => t.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      for(const it of entries){
        if(it.isIntersecting){
          it.target.classList.add('is-revealed');
          io.unobserve(it.target);
        }
      }
    }, {rootMargin: '80px 0px'});
    targets.forEach(t => io.observe(t));
  }

  // Wait for script.js to populate home content, then enhance.
  function whenLeadReady(){
    const host = doc.getElementById('lead-story');
    if(!host) return;
    if(host.children.length){
      injectPriceSticker(); spotlightLead(); revealOnScroll();
      return;
    }
    // If not yet populated, observe briefly
    const mo = new MutationObserver(() => {
      if(host.children.length){
        mo.disconnect();
        injectPriceSticker(); spotlightLead(); revealOnScroll();
      }
    });
    mo.observe(host, {childList:true, subtree:false});
    // safety timeout
    setTimeout(() => { try{ mo.disconnect(); }catch{} }, 3000);
  }

  doc.addEventListener('DOMContentLoaded', () => onceIdle(whenLeadReady));
})();