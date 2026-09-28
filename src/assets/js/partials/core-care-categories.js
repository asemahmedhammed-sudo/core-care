// All content comes from the store's navigation, never from the reference shop.
export function safeMenuUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, window.location.origin);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
}

class CoreCareCategories extends HTMLElement {
    connectedCallback() {
        this.abort?.abort();
        this.abort = new AbortController();
        const options = { signal: this.abort.signal };
        this.trigger = document.querySelector('[data-categories-toggle]');
        this.ar = document.documentElement.lang.startsWith('ar');
        this.trigger?.addEventListener('click', () => this.setOpen(this.hidden), options);
        document.addEventListener('click', e => {
            if (!this.hidden && !this.contains(e.target) && !this.trigger?.contains(e.target)) this.setOpen(false);
        }, options);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !this.hidden) { this.setOpen(false); this.trigger?.focus(); }
        }, options);
        document.addEventListener('focusin', e => {
            if (!this.hidden && !this.contains(e.target) && !this.trigger?.contains(e.target)) this.setOpen(false);
        }, options);
        this.status(this.ar ? 'جارٍ تحميل الأقسام…' : 'Loading categories…');
        this.load();
    }

    disconnectedCallback() { this.abort?.abort(); }

    setOpen(open) {
        this.hidden = !open;
        this.trigger?.setAttribute('aria-expanded', String(open));
        if (open) this.querySelector('[role="tab"][aria-selected="true"]')?.focus();
    }

    element(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text != null) el.textContent = String(text);
        return el;
    }

    status(text, retry = false) {
        this.replaceChildren();
        const message = this.element('p', 'core-categories__status', text);
        message.setAttribute('role', 'status');
        this.append(message);
        if (retry) {
            const button = this.element('button', 'core-categories__retry', this.ar ? 'إعادة المحاولة' : 'Try again');
            button.type = 'button';
            button.addEventListener('click', () => this.load());
            this.append(button);
        }
    }

    async load() {
        this.status(this.ar ? 'جارٍ تحميل الأقسام…' : 'Loading categories…');
        const signal = this.abort.signal;
        try {
            await salla.onReady();
            const { data } = await salla.api.component.getMenus();
            if (signal.aborted) return;
            this.menus = Array.isArray(data) ? data.filter(item => item && item.title) : [];
            if (!this.menus.length) return this.status(this.ar ? 'لا توجد أقسام مضافة حاليًا.' : 'No categories available yet.');
            this.render();
        } catch {
            if (!signal.aborted) this.status(this.ar ? 'تعذّر تحميل الأقسام.' : 'Unable to load categories.', true);
        }
    }

    image(item, className) {
        const src = safeMenuUrl(item.image);
        if (!src) return null;
        const img = this.element('img', className);
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.addEventListener('error', () => img.remove(), { once: true });
        return img;
    }

    link(item, className, title = item.title) {
        const href = safeMenuUrl(item.url);
        const el = this.element(href ? 'a' : 'span', className, title);
        if (href) el.href = href;
        return el;
    }

    descendants(items, depth = 0) {
        const list = this.element('ul', 'core-categories__children');
        (Array.isArray(items) ? items : []).forEach(item => {
            if (!item || !item.title) return;
            const li = this.element('li');
            li.append(this.link(item, 'core-categories__link'));
            if (item.children?.length && depth < 12) li.append(this.descendants(item.children, depth + 1));
            list.append(li);
        });
        return list;
    }

    render() {
        this.replaceChildren();
        const toolbar = this.element('div', 'core-categories__toolbar');
        toolbar.append(this.element('strong', '', this.ar ? 'تسوّقي حسب القسم' : 'Shop by category'));
        const close = this.element('button', 'core-categories__close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', this.ar ? 'إغلاق الأقسام' : 'Close categories');
        close.addEventListener('click', () => { this.setOpen(false); this.trigger?.focus(); });
        toolbar.append(close);
        const grid = this.element('div', 'core-categories__grid');
        const tabs = this.element('div', 'core-categories__tabs');
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', this.ar ? 'الأقسام' : 'Categories');
        tabs.setAttribute('aria-orientation', 'vertical');
        this.panels = this.element('div', 'core-categories__panels');
        this.buttons = this.menus.map((item, index) => {
            const button = this.element('button', 'core-categories__tab');
            button.type = 'button';
            button.id = `core-category-tab-${index}`;
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', `core-category-panel-${index}`);
            const image = this.image(item, 'core-categories__thumb');
            if (image) button.append(image);
            button.append(this.element('span', '', item.title));
            button.addEventListener('click', () => this.select(index));
            button.addEventListener('keydown', e => {
                const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
                if (!keys.includes(e.key)) return;
                e.preventDefault();
                const next = e.key === 'Home' ? 0 : e.key === 'End' ? this.buttons.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + this.buttons.length) % this.buttons.length;
                this.select(next);
                this.buttons[next].focus();
            });
            tabs.append(button);
            return button;
        });
        grid.append(tabs, this.panels);
        this.append(toolbar, grid);
        this.select(0);
    }

    select(index) {
        this.buttons.forEach((button, i) => {
            button.setAttribute('aria-selected', String(i === index));
            button.tabIndex = i === index ? 0 : -1;
        });
        const item = this.menus[index];
        const panel = this.element('section', 'core-categories__panel');
        panel.id = `core-category-panel-${index}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', this.buttons[index].id);
        panel.tabIndex = 0;
        panel.append(this.link(item, 'core-categories__all', this.ar ? `عرض جميع منتجات ${item.title}` : `Shop all ${item.title}`));
        const content = this.element('div', 'core-categories__content');
        const groups = this.element('div', 'core-categories__groups');
        (Array.isArray(item.children) ? item.children : []).forEach(child => {
            if (!child || !child.title) return;
            const group = this.element('section', 'core-categories__group');
            const heading = this.element('h3');
            heading.append(this.link(child, 'core-categories__group-title'));
            group.append(heading, this.descendants(child.children));
            groups.append(group);
        });
        content.append(groups);
        const image = this.image(item, 'core-categories__feature-image');
        if (image) {
            const feature = this.link(item, 'core-categories__feature', '');
            feature.setAttribute('aria-label', item.title);
            feature.append(image);
            content.append(feature);
        }
        panel.append(content);
        this.panels.replaceChildren(panel);
    }
}

customElements.define('core-care-categories', CoreCareCategories);
