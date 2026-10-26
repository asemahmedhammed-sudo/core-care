// All content comes from the store's own categories (Products → Categories in Salla), never from the
// reference shop. The header menu is not used here: its links can outlive deleted categories.
export function safeMenuUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, window.location.origin);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
}

// Phones (with the app tab bar) show the categories as an app-style page: a rail of the top-level
// categories and, for the selected one, its subcategories as image circles. Larger screens show the
// same tree as a dropdown with titled subcategory groups.
const COMPACT_QUERY = '(max-width: 767px)';
const TREE_KEY = 'cc-categories-tree';

export function categoryIdFromUrl(value) {
    const url = safeMenuUrl(value);
    const match = url && new URL(url).pathname.match(/\/c(\d+)\/?$/);
    return match ? match[1] : null;
}

// Menu links and Salla categories in one shape: { title, url, image, children }.
export function categoryNode(item, depth = 0) {
    const kids = Array.isArray(item?.children) && item.children.length ? item.children : item?.sub_categories;
    return {
        title: String(item?.title || item?.name || '').trim(),
        url: item?.url,
        image: item?.image,
        children: depth < 4 && Array.isArray(kids) ? kids.map(kid => categoryNode(kid, depth + 1)).filter(kid => kid.title) : [],
    };
}

// Salla's storefront tree lists only visible categories (plus its own brands entry); nameless or
// unlinked entries are dropped.
export function storeCategories(tree) {
    return (Array.isArray(tree) ? tree : []).map(item => categoryNode(item)).filter(item => item.title && safeMenuUrl(item.url));
}

// Subcategories with their own children become titled groups; the rest share one grid of circles.
export function categorySections(children) {
    const items = Array.isArray(children) ? children : [];
    return { leaves: items.filter(item => !item.children.length), groups: items.filter(item => item.children.length) };
}

// The letter shown when a category has no image; Arabic names skip their «ال».
export function categoryInitial(title) {
    const label = String(title || '').trim();
    return (label.startsWith('ال') && label.length > 2 ? label.slice(2, 3) : label.slice(0, 1)).toUpperCase();
}

class CoreCareCategories extends HTMLElement {
    connectedCallback() {
        this.abort?.abort();
        this.abort = new AbortController();
        const options = { signal: this.abort.signal };
        // The header trigger and the mobile tab bar open the same panel; focus returns to the one used.
        this.triggers = [...document.querySelectorAll('[data-categories-toggle]')];
        this.trigger = this.triggers[0];
        this.ar = document.documentElement.lang.startsWith('ar');
        this.triggers.forEach(trigger => trigger.addEventListener('click', () => this.setOpen(this.hidden, trigger), options));
        const outside = target => !this.contains(target) && !this.triggers.some(trigger => trigger.contains(target));
        document.addEventListener('click', e => {
            if (!this.hidden && outside(e.target)) this.setOpen(false);
        }, options);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !this.hidden) { this.setOpen(false); this.trigger?.focus(); }
        }, options);
        document.addEventListener('focusin', e => {
            if (!this.hidden && outside(e.target)) this.setOpen(false);
        }, options);
        this.media = window.matchMedia(COMPACT_QUERY);
        this.media.addEventListener('change', () => { if (this.menus?.length) this.render(); this.place(); }, options);
        window.addEventListener('resize', () => { if (!this.hidden) this.place(); }, options);
        this.status(this.ar ? 'جارٍ تحميل الأقسام…' : 'Loading categories…');
        this.load();
    }

    get compact() { return !!this.media?.matches && document.body.classList.contains('cc-has-tabbar'); }

    // On phones the sheet opens under the compact header, so its search stays in view as in the app;
    // when the header has scrolled away it covers the screen and shows its own title and close button.
    place() {
        if (!this.compact) {
            this.style.removeProperty('--cc-categories-top');
            this.removeAttribute('data-under-header');
            return;
        }
        const bottom = Math.max(0, Math.round(document.querySelector('.store-header')?.getBoundingClientRect().bottom || 0));
        const under = bottom >= 56;
        this.toggleAttribute('data-under-header', under);
        this.style.setProperty('--cc-categories-top', `${under ? bottom : 0}px`);
    }

    disconnectedCallback() { this.abort?.abort(); document.documentElement.classList.remove('cc-categories-open'); }

    setOpen(open, trigger) {
        this.hidden = !open;
        if (trigger) this.trigger = trigger;
        this.triggers.forEach(item => item.setAttribute('aria-expanded', String(open)));
        // Locks page scroll only where the panel is a full-screen sheet (see core-care-app-nav.scss).
        document.documentElement.classList.toggle('cc-categories-open', open);
        if (open) this.place();
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
            const tree = await this.loadTree();
            if (signal.aborted) return;
            this.menus = storeCategories(tree);
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
        this.classList.toggle('core-categories--compact', this.compact);
        this.select(Math.min(this.current || 0, this.menus.length - 1));
    }

    select(index) {
        this.buttons.forEach((button, i) => {
            button.setAttribute('aria-selected', String(i === index));
            button.tabIndex = i === index ? 0 : -1;
        });
        this.current = index;
        if (this.compact) return this.selectCompact(index);
        const item = this.menus[index];
        const panel = this.element('section', 'core-categories__panel');
        panel.id = `core-category-panel-${index}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', this.buttons[index].id);
        panel.tabIndex = 0;
        // Salla's brands entry is a page, not a category, so it keeps its own name.
        const label = !categoryIdFromUrl(item.url) ? item.title : this.ar ? `عرض جميع منتجات ${item.title}` : `Shop all ${item.title}`;
        panel.append(this.link(item, 'core-categories__all', label));
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

    // Salla's category tree, kept for the visit so other pages do not request it again.
    async loadTree() {
        const key = `${TREE_KEY}-${document.documentElement.lang || 'ar'}`;
        let cached = null;
        try { cached = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* private mode */ }
        if (Array.isArray(cached) && cached.length) return cached;
        const { data } = await salla.product.api.categories();
        const tree = Array.isArray(data) ? data : [];
        try { sessionStorage.setItem(key, JSON.stringify(tree)); } catch { /* private mode or full storage */ }
        return tree;
    }

    circle(item) {
        const link = this.link(item, 'core-categories__circle', '');
        const media = this.element('span', 'core-categories__circle-media');
        media.setAttribute('aria-hidden', 'true');
        media.append(this.element('span', 'core-categories__circle-initial', categoryInitial(item.title)));
        const image = this.image(item, 'core-categories__circle-image');
        if (image) {
            image.decoding = 'async';
            image.addEventListener('load', () => media.classList.add('has-image'), { once: true });
            media.append(image);
        }
        link.append(media, this.element('span', 'core-categories__circle-name', item.title));
        const li = this.element('li');
        li.append(link);
        return li;
    }

    circles(items) {
        const list = this.element('ul', 'core-categories__circles');
        list.setAttribute('role', 'list');
        list.append(...items.map(item => this.circle(item)));
        return list;
    }

    group(child, id) {
        const section = this.element('section', 'core-categories__section');
        const head = this.element('div', 'core-categories__section-head');
        const title = this.element('h3', 'core-categories__section-title', child.title);
        const list = this.circles(child.children);
        list.id = id;
        head.append(title);
        if (safeMenuUrl(child.url)) {
            const all = this.link(child, 'core-categories__view-all', this.ar ? 'عرض الكل' : 'View all');
            all.setAttribute('aria-label', this.ar ? `عرض كل ${child.title}` : `View all ${child.title}`);
            head.append(all);
        }
        const toggle = this.element('button', 'core-categories__collapse');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-controls', id);
        toggle.setAttribute('aria-label', child.title);
        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'm6 15 6-6 6 6');
        chevron.append(path);
        toggle.append(chevron);
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open));
            list.hidden = !open;
        });
        head.append(toggle);
        section.append(head, list);
        return section;
    }

    selectCompact(index) {
        const item = this.menus[index];
        const panel = this.element('section', 'core-categories__panel');
        panel.id = `core-category-panel-${index}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', this.buttons[index].id);
        panel.tabIndex = 0;
        this.panels.replaceChildren(panel);
        const id = categoryIdFromUrl(item.url);
        const bannerImage = this.image(item, 'core-categories__banner-image');
        if (bannerImage) {
            const banner = this.link(item, 'core-categories__banner', '');
            banner.setAttribute('aria-label', item.title);
            bannerImage.decoding = 'async';
            banner.append(bannerImage);
            panel.append(banner);
        }
        const card = this.element('div', 'core-categories__card');
        const label = id || item.children.length ? (this.ar ? 'جميع المنتجات' : 'All products') : item.title;
        const all = this.link(item, 'core-categories__card-all', label);
        if (id || item.children.length) all.setAttribute('aria-label', this.ar ? `جميع منتجات ${item.title}` : `All ${item.title} products`);
        card.append(all);
        const { leaves, groups } = categorySections(item.children);
        if (leaves.length) {
            const section = this.element('section', 'core-categories__section');
            section.append(this.circles(leaves));
            card.append(section);
        }
        groups.forEach((child, i) => card.append(this.group(child, `core-category-group-${index}-${i}`)));
        panel.append(card);
    }
}

customElements.define('core-care-categories', CoreCareCategories);
