(() => {
  const root = document.querySelector('.page-project');
  if (!root) return;
  const films = [...root.querySelectorAll('video')];
  films.forEach(film => film.addEventListener('play', () => {
    films.forEach(other => { if (other !== film) other.pause(); });
  }));

  const compareButtons = [...root.querySelectorAll('[data-comparison]')];
  const comparePanels = [...root.querySelectorAll('[data-comparison-panel]')];
  const selectComparison = id => {
    compareButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.comparison === id)));
    comparePanels.forEach(panel => { panel.hidden = panel.dataset.comparisonPanel !== id; });
  };
  compareButtons.forEach(button => button.addEventListener('click', () => selectComparison(button.dataset.comparison)));
  selectComparison('living');
  root.querySelector('.project-comparison-controls').hidden = false;

  const filters = [...root.querySelectorAll('[data-project-filter]')];
  const items = [...root.querySelectorAll('[data-project-category]')];
  const count = root.querySelector('[data-project-count]');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.projectFilter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    items.forEach(item => { item.hidden = category !== 'all' && item.dataset.projectCategory !== category; });
    const visible = items.filter(item => !item.hidden).length;
    count.textContent = `${visible} ${visible === 1 ? 'photograph' : 'photographs'}${category === 'all' ? '' : ` · ${button.textContent}`}`;
  }));
  root.querySelector('.project-gallery-filters').hidden = false;

  const dialog = root.querySelector('.project-dialog');
  if (!dialog?.showModal) return; // Photograph links remain usable in older browsers.
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('#project-dialog-caption');
  const counter = dialog.querySelector('[data-project-counter]');
  let activeLinks = [], index = 0, opener;
  const showImage = nextIndex => {
    index = (nextIndex + activeLinks.length) % activeLinks.length;
    const source = activeLinks[index].querySelector('img');
    image.srcset = source.srcset;
    image.sizes = '(max-width: 700px) calc(100vw - 44px), calc(100vw - 100px)';
    image.src = activeLinks[index].href;
    image.alt = source.alt;
    image.width = source.width;
    image.height = source.height;
    caption.textContent = activeLinks[index].closest('figure').querySelector('figcaption > span').textContent;
    counter.textContent = `${index + 1} / ${activeLinks.length}`;
  };
  root.querySelectorAll('[data-project-photo]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    activeLinks = items.filter(item => !item.hidden).map(item => item.querySelector('[data-project-photo]'));
    showImage(activeLinks.indexOf(link));
    dialog.showModal();
    dialog.querySelector('[data-project-close]').focus();
  }));
  dialog.querySelector('[data-project-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-project-prev]').addEventListener('click', () => showImage(index - 1));
  dialog.querySelector('[data-project-next]').addEventListener('click', () => showImage(index + 1));
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button:not([disabled])')];
      const current = buttons.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && (current === buttons.length - 1 || current < 0)) { event.preventDefault(); buttons[0].focus(); }
    }
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(index - 1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
})();
