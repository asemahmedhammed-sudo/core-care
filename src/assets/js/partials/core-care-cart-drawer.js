// Side cart. Reads and changes the cart only through salla.cart; checkout stays on Salla's own flow.

// Whole-number discount shown on an item, only when Salla reports a real reduced price.
export function discountPercent(original, price) {
    const before = Number(original);
    const now = Number(price);
    if (!Number.isFinite(before) || !Number.isFinite(now) || before <= 0 || now < 0 || now >= before) return 0;
    return Math.round((1 - now / before) * 100);
}

// Money the customer saves on sale items plus the cart-level discount reported by Salla.
export function cartSavings(cart) {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    const sale = items.reduce((sum, item) => {
        const before = Number(item?.original_price);
        const now = Number(item?.price);
        const quantity = Number(item?.quantity) || 0;
        return item?.is_on_sale && before > now && now >= 0 ? sum + (before - now) * quantity : sum;
    }, 0);
    const discount = Number(cart?.discount);
    return Math.round((sale + (Number.isFinite(discount) && discount > 0 ? discount : 0)) * 100) / 100;
}

// salla.money() returns trusted platform markup such as `39 <i class=sicon-sar></i>`; keep only its parts.
export function moneyParts(markup) {
    const value = String(markup ?? '');
    return { text: value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(), riyal: /sicon-sar/.test(value) };
}

export function safeHttpUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value, base);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

// Items whose options, files, notes or donation amount need the full cart page to edit.
export function needsCartPage(item) {
    return Boolean(item?.options?.length || item?.attachments?.length || item?.can_add_note || item?.can_upload_file || item?.type === 'donating');
}

const ICONS = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    trash: 'M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
    bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6.5a3 3 0 0 1 6 0V8',
    truck: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
};

let cartListenerBound = false;

class CoreCareCartDrawer extends HTMLElement {
    connectedCallback() {
        this.abort?.abort();
        this.abort = new AbortController();
        const options = { signal: this.abort.signal };
        this.panel = this.querySelector('.cc-cart-drawer__panel');
        this.body = this.querySelector('[data-cart-body]');
        this.footer = this.querySelector('[data-cart-footer]');
        this.countEl = this.querySelector('[data-cart-count]');
        this.totalEl = this.querySelector('[data-cart-total]');
        this.taxEl = this.querySelector('[data-cart-tax]');
        this.savedEl = this.querySelector('[data-cart-saved]');
        this.liveEl = this.querySelector('[data-cart-live]');
        this.checkoutBtn = this.querySelector('[data-cart-checkout]');
        if (!this.panel || !this.body) return;
        this.requestId = 0;
        // The header cart is Salla's <salla-cart-summary> link; without JavaScript it still opens the cart page.
        document.addEventListener('click', event => {
            const trigger = event.target instanceof Element ? event.target.closest('salla-cart-summary, [data-cart-drawer-open]') : null;
            if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (window.salla?.mobile?.isSpaWebview?.()) return;
            event.preventDefault();
            this.open(trigger);
        }, { ...options, capture: true });
        this.querySelectorAll('[data-cart-close]').forEach(el => el.addEventListener('click', () => this.close(), options));
        this.addEventListener('keydown', event => this.onKeydown(event), options);
        this.checkoutBtn?.addEventListener('click', () => this.checkout(), options);
        if (!cartListenerBound) {
            cartListenerBound = true;
            // Items added elsewhere (product page, cards) refresh an open drawer.
            window.salla?.onReady?.(() => window.salla?.cart?.event?.onUpdated?.(() => {
                const drawer = document.querySelector('core-care-cart-drawer');
                if (drawer && !drawer.hidden && !drawer.mutating) drawer.refresh();
            }));
        }
    }

    disconnectedCallback() { this.abort?.abort(); this.unlock(); }

    label(name, value) {
        const text = this.dataset[`label${name}`] || '';
        return value === undefined ? text : text.replace('%s', value);
    }

    open(trigger) {
        this.returnFocus = trigger?.querySelector?.('a, button') || trigger || document.activeElement;
        clearTimeout(this.hideTimer);
        this.hidden = false;
        document.documentElement.classList.add('cc-cart-drawer-open');
        requestAnimationFrame(() => this.classList.add('is-open'));
        this.panel.focus({ preventScroll: true });
        this.refresh();
    }

    close() {
        if (this.hidden) return;
        this.classList.remove('is-open');
        this.unlock();
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        this.hideTimer = setTimeout(() => { this.hidden = true; }, reduce ? 0 : 300);
        this.returnFocus?.focus?.({ preventScroll: true });
    }

    unlock() { document.documentElement.classList.remove('cc-cart-drawer-open'); }

    onKeydown(event) {
        if (this.hidden) return;
        if (event.key === 'Escape') {
            event.stopPropagation();
            this.close();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...this.panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')]
            .filter(el => el.offsetParent !== null || el === document.activeElement);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === this.panel)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    async refresh() {
        const request = ++this.requestId;
        this.body.setAttribute('aria-busy', 'true');
        try {
            const salla = window.salla;
            if (!salla?.cart?.details) throw new Error('Salla unavailable');
            await salla.onReady?.();
            const response = await salla.cart.details(null, ['options', 'attachments']);
            if (request !== this.requestId) return;
            this.render(response?.data?.cart || response?.data || {});
        } catch (error) {
            if (request !== this.requestId) return;
            // A visitor who never added anything has no cart yet.
            if (/CartNotCreated/.test(`${error?.name} ${error?.message} ${error}`)) this.render({ items: [] });
            else this.renderError();
        } finally {
            if (request === this.requestId) this.body.setAttribute('aria-busy', 'false');
        }
    }

    el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    icon(name, className = '') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        if (className) svg.setAttribute('class', className);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', ICONS[name]);
        svg.append(path);
        return svg;
    }

    money(amount, className) {
        const node = this.el('span', className);
        const formatted = window.salla?.money ? window.salla.money(Number(amount) || 0) : String(Number(amount) || 0);
        const { text, riyal } = moneyParts(formatted);
        node.append(document.createTextNode(text));
        if (riyal) {
            const symbol = this.el('i', 'sicon-sar');
            symbol.setAttribute('aria-hidden', 'true');
            node.append(' ', symbol);
        }
        return node;
    }

    render(cart) {
        const items = (Array.isArray(cart?.items) ? cart.items : []).filter(Boolean);
        const count = Number(cart?.count) || items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        this.countEl.hidden = !items.length;
        this.countEl.textContent = items.length ? this.label('Count', count) : '';
        if (!items.length) {
            this.footer.hidden = true;
            this.body.replaceChildren(this.renderEmpty());
            return;
        }
        const nodes = [];
        if (cart.free_shipping_bar) nodes.push(this.renderFreeShipping(cart.free_shipping_bar));
        const list = this.el('ul', 'cc-cart-drawer__items');
        items.forEach(item => list.append(this.renderItem(item)));
        nodes.push(list);
        if (this.dataset.coupons === 'true') nodes.push(this.couponsSection());
        const related = this.relatedSection(items[0]?.product_id);
        if (related) nodes.push(related);
        this.body.replaceChildren(...nodes);
        this.renderTotals(cart);
        this.restoreFocus();
    }

    renderEmpty() {
        const wrap = this.el('div', 'cc-cart-drawer__empty');
        const art = this.el('span', 'cc-cart-drawer__empty-art');
        art.append(this.icon('bag'));
        const cta = this.el('a', 'cc-cart-drawer__primary', this.label('ShopNow'));
        cta.href = safeHttpUrl(this.dataset.homeUrl, window.location.href) || '/';
        wrap.append(art, this.el('h3', 'cc-cart-drawer__empty-title', this.label('EmptyTitle')), this.el('p', 'cc-cart-drawer__empty-text', this.label('EmptyText')), cta);
        return wrap;
    }

    renderError() {
        this.footer.hidden = true;
        const wrap = this.el('div', 'cc-cart-drawer__empty');
        const retry = this.el('button', 'cc-cart-drawer__primary', this.label('Retry'));
        retry.type = 'button';
        retry.addEventListener('click', () => this.refresh());
        wrap.append(this.el('p', 'cc-cart-drawer__empty-text', this.label('Error')), retry);
        this.body.replaceChildren(wrap);
    }

    renderFreeShipping(bar) {
        const box = this.el('div', 'cc-cart-drawer__shipping');
        const chip = this.el('span', 'cc-cart-drawer__shipping-chip');
        chip.append(this.icon('truck'), this.el('span', '', this.label('FreeShipping')));
        const message = this.el('p', 'cc-cart-drawer__shipping-text');
        if (bar.has_free_shipping) message.textContent = this.label('FreeShippingDone');
        else {
            const [before, after = ''] = this.label('FreeShippingRemaining').split('%s');
            message.append(before, this.money(bar.remaining, 'cc-cart-drawer__shipping-amount'), after);
        }
        const percent = Math.max(0, Math.min(100, Number(bar.percent) || 0));
        const track = this.el('span', 'cc-cart-drawer__progress');
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(Math.round(percent)));
        track.setAttribute('aria-label', this.label('FreeShipping'));
        const fill = this.el('span', 'cc-cart-drawer__progress-fill');
        fill.style.width = `${percent}%`;
        track.append(fill);
        box.append(chip, message, track);
        return box;
    }

    renderItem(item) {
        const row = this.el('li', 'cc-cart-item');
        row.dataset.itemId = String(item.id);
        const url = safeHttpUrl(item.url, window.location.href);
        const name = String(item.product_name || '');
        const media = this.el(url ? 'a' : 'span', 'cc-cart-item__media');
        if (url) { media.href = url; media.tabIndex = -1; media.setAttribute('aria-hidden', 'true'); }
        const image = safeHttpUrl(item.product_image, window.location.href);
        if (image) {
            const img = this.el('img');
            img.src = image;
            img.alt = '';
            img.width = 88;
            img.height = 88;
            img.loading = 'lazy';
            img.decoding = 'async';
            media.append(img);
        }
        const info = this.el('div', 'cc-cart-item__info');
        const title = this.el(url ? 'a' : 'p', 'cc-cart-item__name', name);
        if (url) title.href = url;
        info.append(title);
        const prices = this.el('p', 'cc-cart-item__prices');
        const percent = item.is_on_sale ? discountPercent(item.original_price, item.price) : 0;
        prices.append(this.money(item.price, `cc-cart-item__price${percent ? ' is-sale' : ''}`));
        if (percent) {
            const old = this.money(item.original_price, 'cc-cart-item__old');
            prices.append(old, this.el('span', 'cc-cart-item__discount', `-${percent}%`));
        }
        info.append(prices);
        if (item.is_available === false) info.append(this.el('p', 'cc-cart-item__note is-alert', this.label('Unavailable')));
        if (needsCartPage(item)) {
            const edit = this.el('a', 'cc-cart-item__edit', this.label('Edit'));
            edit.href = safeHttpUrl(this.dataset.cartUrl, window.location.href) || '#';
            info.append(edit);
        }
        row.append(media, info, this.renderQuantity(item, name));
        return row;
    }

    renderQuantity(item, name) {
        const quantity = Number(item.quantity) || 1;
        if (item.is_hidden_quantity || item.type === 'donating') {
            const fixed = this.el('p', 'cc-cart-item__qty-fixed');
            fixed.append(this.el('span', 'sr-only', `${this.label('Quantity')}: `), document.createTextNode(String(quantity)));
            return fixed;
        }
        const group = this.el('div', 'cc-cart-item__qty');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', `${this.label('Quantity')}: ${name}`);
        const lower = this.el('button', 'cc-cart-item__qty-btn');
        lower.type = 'button';
        lower.dataset.action = quantity > 1 ? 'decrease' : 'remove';
        lower.setAttribute('aria-label', `${quantity > 1 ? this.label('Decrease') : this.label('Remove')}: ${name}`);
        lower.append(this.icon(quantity > 1 ? 'minus' : 'trash'));
        lower.addEventListener('click', () => (quantity > 1 ? this.update(item, quantity - 1, 'decrease') : this.remove(item)));
        const value = this.el('output', 'cc-cart-item__qty-value', String(quantity));
        value.setAttribute('aria-live', 'polite');
        const raise = this.el('button', 'cc-cart-item__qty-btn');
        raise.type = 'button';
        raise.dataset.action = 'increase';
        raise.setAttribute('aria-label', `${this.label('Increase')}: ${name}`);
        raise.append(this.icon('plus'));
        raise.addEventListener('click', () => this.update(item, quantity + 1, 'increase'));
        group.append(lower, value, raise);
        return group;
    }

    couponsSection() {
        // Keep one Salla coupons component so reopening does not refetch it.
        if (!this.coupons) {
            this.coupons = this.el('div', 'cc-cart-drawer__block cc-cart-drawer__coupons');
            this.coupons.append(document.createElement('salla-cart-coupons'));
        }
        return this.coupons;
    }

    relatedSection(productId) {
        const id = Number(productId);
        if (!id || !window.salla?.config?.get?.('store.settings.product.related_products_enabled')) return null;
        if (this.relatedId !== id) {
            this.relatedId = id;
            this.related = this.el('section', 'cc-cart-drawer__block cc-cart-drawer__related');
            this.related.setAttribute('aria-label', this.label('Recommended'));
            const slider = document.createElement('salla-products-slider');
            slider.setAttribute('source', 'related');
            slider.setAttribute('source-value', String(id));
            slider.setAttribute('limit', '8');
            slider.setAttribute('block-title', this.label('Recommended'));
            slider.sliderConfig = { slidesPerView: 2.2, spaceBetween: 12, breakpoints: { 420: { slidesPerView: 2.6 } } };
            this.related.append(slider);
        }
        return this.related;
    }

    renderTotals(cart) {
        this.footer.hidden = false;
        this.totalEl.replaceChildren(this.money(cart.total));
        const tax = Number(cart.tax_amount) > 0;
        this.taxEl.hidden = !tax;
        this.taxEl.textContent = tax ? this.label('Tax') : '';
        const saved = cartSavings(cart);
        this.savedEl.hidden = saved <= 0;
        this.savedEl.replaceChildren();
        if (saved > 0) {
            const [before, after = ''] = this.label('Saved').split('%s');
            this.savedEl.append(before, this.money(saved), after);
        }
    }

    async update(item, quantity, action) {
        this.focusKey = `${item.id}:${action}`;
        await this.mutate(() => window.salla.cart.updateItem({ id: item.id, quantity }));
    }

    async remove(item) {
        this.focusKey = null;
        await this.mutate(() => window.salla.cart.deleteItem(item.id));
    }

    async mutate(request) {
        if (this.mutating) return;
        this.mutating = true;
        this.body.querySelectorAll('.cc-cart-item__qty-btn').forEach(button => { button.disabled = true; });
        try { await request(); } catch { /* Salla's notifier reports the reason, e.g. stock limits. */ }
        await this.refresh();
        this.mutating = false;
        this.liveEl.textContent = this.label('Updated');
    }

    restoreFocus() {
        if (!this.focusKey) return;
        const [id, action] = this.focusKey.split(':');
        this.focusKey = null;
        const row = [...this.body.querySelectorAll('.cc-cart-item')].find(node => node.dataset.itemId === id);
        const target = row?.querySelector(`[data-action="${action}"]`) || row?.querySelector('.cc-cart-item__qty-btn');
        (target || this.panel).focus({ preventScroll: true });
    }

    async checkout() {
        if (!this.checkoutBtn || this.checkoutBtn.disabled) return;
        this.checkoutBtn.disabled = true;
        this.checkoutBtn.setAttribute('aria-busy', 'true');
        try {
            // Guests get Salla's login modal; close the drawer so the modal is not stacked under it.
            if (window.salla?.config?.isGuest?.()) this.close();
            // Salla then redirects to its hosted checkout.
            await window.salla.cart.submit();
        } catch { /* Salla shows the error. */ } finally {
            this.checkoutBtn.disabled = false;
            this.checkoutBtn.removeAttribute('aria-busy');
        }
    }
}

if (!customElements.get('core-care-cart-drawer')) customElements.define('core-care-cart-drawer', CoreCareCartDrawer);
