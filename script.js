(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobilePanel = document.querySelector('.mobile-panel');

  const propertyConfig = window.COMFORT_BASE_PROPERTIES;
  if (propertyConfig && document.querySelector('[data-property-title]')) {
    const routeSlug = location.pathname.split('/').filter(Boolean).at(-1);
    const routeProperty = Object.entries(propertyConfig).find(([, item]) => item.slug === routeSlug)?.[0];
    const requestedId = routeProperty || new URLSearchParams(location.search).get('property') || 'parkside';
    const property = propertyConfig[requestedId] || propertyConfig.parkside;
    document.title = `${property.title} | Comfort Base`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.content = `${property.title} in ${property.location}. ${property.description}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `/stays/${property.slug}`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.content = `${property.title} | Comfort Base`;
    if (ogDescription) ogDescription.content = property.description;
    document.querySelectorAll('[data-property-title]').forEach(el => { el.textContent = property.title; });
    document.querySelectorAll('[data-property-location]').forEach(el => { el.textContent = property.location; });
    document.querySelectorAll('[data-property-short-location]').forEach(el => { el.textContent = property.location.split(' · ')[0]; });
    document.querySelectorAll('[data-property-guests]').forEach(el => { el.textContent = `${property.guests} guest${property.guests === 1 ? '' : 's'}`; });
    document.querySelectorAll('[data-property-bedrooms]').forEach(el => { el.textContent = `${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}`; });
    document.querySelectorAll('[data-property-bathrooms]').forEach(el => { el.textContent = `${property.bathrooms} bathroom${property.bathrooms === 1 ? '' : 's'}`; });
    document.querySelectorAll('[data-property-description]').forEach(el => { el.textContent = property.description; });
    document.querySelectorAll('[data-property-parking]').forEach(el => { el.textContent = property.parking; });
    document.querySelectorAll('[data-property-nearby]').forEach(el => { el.textContent = property.nearby; });
    document.querySelectorAll('[data-property-image]').forEach(img => {
      const imageIndex = Number(img.dataset.propertyImage);
      img.src = property.images[imageIndex]; img.alt = property.imageAlts[imageIndex];
    });
    document.querySelectorAll('[data-booking-link]').forEach(link => {
      const label = link.dataset.bookingLabel || 'Book Your Stay';
      if (property.externalBookingUrl) {
        link.href = property.externalBookingUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = `${label} <span aria-hidden="true">↗</span>`;
        link.setAttribute('aria-label', `${label} for ${property.title} (opens in a new tab)`);
      } else {
        link.removeAttribute('href'); link.removeAttribute('target'); link.removeAttribute('rel');
        link.classList.add('disabled'); link.setAttribute('aria-disabled', 'true'); link.setAttribute('tabindex', '-1');
        link.textContent = link.dataset.missingLabel || 'Booking link coming soon';
      }
    });
  }

  const updateScroll = () => {
    header?.classList.toggle('scrolled', scrollY > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    }
  };
  addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobilePanel?.setAttribute('aria-hidden', 'true');
  };
  menuToggle?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobilePanel?.setAttribute('aria-hidden', String(!open));
  });
  mobilePanel?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeMenu(); closeGallery(); }
  });

  const revealItems = document.querySelectorAll('[data-reveal], [data-stagger]');
  if (reduceMotion) revealItems.forEach(item => item.classList.add('visible'));
  else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const buttons = [...group.querySelectorAll('[role="tab"]')];
    const images = [...group.querySelectorAll('[data-tab-image]')];
    const activate = button => {
      buttons.forEach(btn => { const active = btn === button; btn.classList.toggle('active', active); btn.setAttribute('aria-selected', String(active)); btn.tabIndex = active ? 0 : -1; });
      images.forEach(img => img.classList.toggle('active', img.dataset.tabImage === button.dataset.tab));
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('keydown', event => {
        if (!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(event.key)) return;
        event.preventDefault();
        const delta = ['ArrowDown','ArrowRight'].includes(event.key) ? 1 : -1;
        const next = buttons[(index + delta + buttons.length) % buttons.length]; activate(next); next.focus();
      });
    });
  });

  const services = {
    transport: { title: 'Arrive with ease', image: 'assets/images/concierge-transport.webp', items: ['Airport transfers','Private drivers','Car hire','Local transportation'] },
    dining: { title: 'Dining, your way', image: 'assets/images/concierge-dining.webp', items: ['Restaurant bookings','Private dining','Grocery delivery','Local recommendations'] },
    experiences: { title: 'Make more of the city', image: 'assets/images/concierge-dining.webp', items: ['Local experiences','Tickets and events','Day trips','Tailored itineraries'] },
    wellness: { title: 'Space to reset', image: 'assets/images/base-bedroom-01.webp', items: ['In-home massage','Fitness sessions','Wellness bookings','Self-care arrangements'] },
    property: { title: 'Everything for your stay', image: 'assets/images/base-living-room-01.webp', items: ['Extra housekeeping','Linen requests','Grocery arrival','Stay assistance'] },
    occasions: { title: 'Thoughtful moments', image: 'assets/images/concierge-dining.webp', items: ['Birthday arrangements','Romantic setups','Flowers and gifts','Celebrations'] },
    business: { title: 'Work without friction', image: 'assets/images/comfort-base-hero.webp', items: ['Workspace support','Transport','Team dining','Extended stays'] }
  };
  const serviceButtons = document.querySelectorAll('.service-tab');
  const serviceImage = document.querySelector('#service-image');
  const servicePanel = document.querySelector('#service-panel');
  serviceButtons.forEach(button => button.addEventListener('click', () => {
    const service = services[button.dataset.service];
    if (!service || !serviceImage || !servicePanel) return;
    serviceButtons.forEach(btn => { const active = btn === button; btn.classList.toggle('active', active); btn.setAttribute('aria-selected', String(active)); });
    serviceImage.classList.add('swapping'); servicePanel.classList.add('swapping');
    setTimeout(() => {
      serviceImage.src = service.image; serviceImage.alt = service.title;
      servicePanel.querySelector('h3').textContent = service.title;
      servicePanel.querySelector('ul').innerHTML = service.items.map(item => `<li>${item}</li>`).join('');
      serviceImage.classList.remove('swapping'); servicePanel.classList.remove('swapping');
    }, reduceMotion ? 0 : 260);
  }));

  const chats = [
    ['Can you organise an airport transfer?', 'Absolutely. We’ll help arrange it.'],
    ['Could you book somewhere special for dinner?', 'Of course. Tell us what you have in mind.'],
    ['Can we have groceries ready when we arrive?', 'Leave the list with us. We’ll do our best to arrange it.']
  ];
  const guestBubble = document.querySelector('[data-chat="guest"]');
  const replyBubble = document.querySelector('[data-chat="reply"]');
  if (guestBubble && replyBubble && !reduceMotion) {
    let chatIndex = 0;
    setInterval(() => {
      guestBubble.classList.add('is-changing'); replyBubble.classList.add('is-changing');
      setTimeout(() => { chatIndex = (chatIndex + 1) % chats.length; guestBubble.textContent = chats[chatIndex][0]; replyBubble.textContent = chats[chatIndex][1]; guestBubble.classList.remove('is-changing'); replyBubble.classList.remove('is-changing'); }, 350);
    }, 5200);
  }

  const steps = document.querySelectorAll('.step');
  if (steps.length) {
    const stepObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { steps.forEach(step => step.classList.remove('active')); entry.target.classList.add('active'); }
    }), { threshold: .55 });
    steps.forEach(step => stepObserver.observe(step));
  }

  document.querySelectorAll('.benefit').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.benefit').forEach(item => item.classList.toggle('active', item === button));
    const image = document.querySelector('#benefit-image');
    if (image) { image.style.opacity = '.15'; setTimeout(() => { image.src = button.dataset.image; image.alt = button.textContent.trim(); image.style.opacity = '1'; }, reduceMotion ? 0 : 260); }
  }));

  document.querySelectorAll('.faq-question').forEach(button => button.addEventListener('click', () => {
    const item = button.closest('.faq-item'); const open = item.classList.toggle('open'); button.setAttribute('aria-expanded', String(open));
  }));

  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button));
    const filter = button.dataset.filter;
    document.querySelectorAll('.property-card[data-type]').forEach(card => {
      const show = filter === 'all' || card.dataset.type.includes(filter);
      card.hidden = !show;
    });
  }));

  const form = document.querySelector('#concierge-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    if (!form.reportValidity()) return;
    status.textContent = 'Your request is ready. Demo mode: connect a secure concierge request service or API to send it to Comfort Base.';
    status.setAttribute('role', 'status');
  });

  const modal = document.querySelector('.modal');
  const galleryButtons = [...document.querySelectorAll('[data-gallery]')];
  let galleryIndex = 0;
  const showGallery = index => {
    if (!modal || !galleryButtons.length) return;
    galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
    const source = galleryButtons[galleryIndex].querySelector('img');
    modal.querySelector('img').src = source.src; modal.querySelector('img').alt = source.alt;
    modal.querySelector('.modal-counter').textContent = `${galleryIndex + 1} / ${galleryButtons.length}`;
  };
  galleryButtons.forEach((button, index) => button.addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); showGallery(index); modal.querySelector('.modal-close').focus(); }));
  function closeGallery() { if (!modal?.classList.contains('open')) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); galleryButtons[galleryIndex]?.focus(); }
  modal?.querySelector('.modal-close')?.addEventListener('click', closeGallery);
  modal?.querySelector('.modal-prev')?.addEventListener('click', () => showGallery(galleryIndex - 1));
  modal?.querySelector('.modal-next')?.addEventListener('click', () => showGallery(galleryIndex + 1));
  modal?.addEventListener('click', event => { if (event.target === modal) closeGallery(); });
  let touchStartX = 0;
  modal?.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  modal?.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) showGallery(galleryIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
  addEventListener('keydown', event => { if (!modal?.classList.contains('open')) return; if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1); if (event.key === 'ArrowRight') showGallery(galleryIndex + 1); });

  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    const heroMedia = document.querySelector('.hero-media img');
    document.querySelector('.hero')?.addEventListener('pointermove', event => {
      if (!heroMedia) return;
      const x = (event.clientX / innerWidth - .5) * 5; const y = (event.clientY / innerHeight - .5) * 4;
      heroMedia.style.transform = `translate(${x}px, ${y}px) scale(1.006)`;
    });
  }
})();
