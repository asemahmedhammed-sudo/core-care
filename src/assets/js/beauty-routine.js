// Lazy mount one documented Salla slider per opened routine; no per-product requests.
export class BeautyRoutine extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.tabs = [...this.querySelectorAll('[role="tab"]')];
    this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.activate(index));
      tab.addEventListener('keydown', event => {
        const rtl = document.documentElement.dir === 'rtl';
        let next;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = this.tabs.length - 1;
        if (event.key === 'ArrowRight') next = index + (rtl ? -1 : 1);
        if (event.key === 'ArrowLeft') next = index + (rtl ? 1 : -1);
        if (next === undefined) return;
        event.preventDefault();
        next = (next + this.tabs.length) % this.tabs.length;
        this.activate(next);
        this.tabs[next].focus();
      });
    });
    if (this.tabs.length) this.activate(0);
  }

  activate(index) {
    this.tabs.forEach((tab, current) => {
      const active = current === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      this.panels[current].hidden = !active;
    });
    const panel = this.panels[index];
    const template = panel.querySelector('template[data-routine-products]');
    if (template) {
      panel.querySelector('[data-routine-mount]').append(template.content.cloneNode(true));
      template.remove();
    }
  }
}

if (!customElements.get('beauty-routine')) customElements.define('beauty-routine', BeautyRoutine);
