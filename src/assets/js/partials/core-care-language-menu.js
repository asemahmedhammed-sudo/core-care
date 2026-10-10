// Header language dropdown. Languages, flags and switching come from Salla, never from fixed data.

// Same URL rewrite as salla-localization-modal: add ?lang= and swap the /<current>/ path segment.
export function languageSwitchUrl(urlWithLang, current, next) {
    if (typeof urlWithLang !== 'string' || !current || !next) return null;
    return urlWithLang.replace(`/${current}/`, `/${next}/`);
}

// Flags are platform assets; accept only absolute HTTPS URLs.
export function safeFlagUrl(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

class CoreCareLanguageMenu extends HTMLElement {
    connectedCallback() {
        this.abort?.abort();
        this.abort = new AbortController();
        const options = { signal: this.abort.signal };
        this.trigger = this.querySelector('[data-language-toggle]');
        this.panel = this.querySelector('[data-language-panel]');
        this.list = this.querySelector('[data-language-list]');
        this.backdrop = this.querySelector('[data-language-backdrop]');
        if (!this.trigger || !this.panel || !this.list) return;
        // event.detail is 0 for keyboard activation; only then move focus into the options.
        this.trigger.addEventListener('click', event => this.setOpen(this.panel.hidden, event.detail === 0), options);
        const dismiss = () => { this.setOpen(false); this.trigger.focus(); };
        this.querySelector('[data-language-close]')?.addEventListener('click', dismiss, options);
        this.backdrop?.addEventListener('click', dismiss, options);
        this.querySelector('[data-currency-open]')?.addEventListener('click', () => {
            this.setOpen(false);
            window.salla?.event?.dispatch('localization::open');
        }, options);
        document.addEventListener('click', event => {
            if (!this.panel.hidden && !this.contains(event.target)) this.setOpen(false);
        }, options);
        document.addEventListener('focusin', event => {
            if (!this.panel.hidden && !this.contains(event.target)) this.setOpen(false);
        }, options);
        this.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || this.panel.hidden) return;
            event.stopPropagation();
            this.setOpen(false);
            this.trigger.focus();
        }, options);
    }

    disconnectedCallback() {
        this.abort?.abort();
        document.documentElement.classList.remove('cc-language-menu-open');
    }

    setOpen(open, keyboard = false) {
        this.panel.hidden = !open;
        if (this.backdrop) this.backdrop.hidden = !open;
        this.trigger.setAttribute('aria-expanded', String(open));
        // Locks page scroll only while the phone bottom sheet is shown (see core-care-header.scss).
        document.documentElement.classList.toggle('cc-language-menu-open', open);
        if (!open) return;
        // Pointer users get the panel focused (no focus ring on an option); keyboard users land on the current language.
        if (!keyboard) this.panel.focus({ preventScroll: true });
        this.load().then(() => {
            if (keyboard && !this.panel.hidden) (this.list.querySelector('[aria-current="true"]') || this.list.querySelector('button'))?.focus();
        });
    }

    load() {
        // One request per page; reopening reuses the rendered list.
        this.loading ??= (async () => {
            const salla = window.Salla;
            if (!salla?.config?.languages) throw new Error('Salla unavailable');
            await salla.onReady?.();
            const languages = await salla.config.languages();
            this.render(Array.isArray(languages) ? languages : Object.values(languages || {}));
        })().catch(() => {
            this.loading = null;
            this.list.replaceChildren(this.element('p', 'core-care-language-menu__status', this.dataset.errorLabel || ''));
        });
        return this.loading;
    }

    element(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }

    render(languages) {
        const current = this.dataset.current || window.Salla?.config?.get?.('user.language_code');
        const items = languages.filter(lang => lang && (lang.code || lang.iso_code) && lang.status !== 'disabled').map(lang => {
            const code = String(lang.code || lang.iso_code);
            const selected = code === current || lang.iso_code === current;
            const button = this.element('button', 'core-care-language-menu__option');
            button.type = 'button';
            button.lang = code;
            button.setAttribute('aria-current', String(selected));
            const mark = this.element('span', 'core-care-language-menu__mark');
            mark.setAttribute('aria-hidden', 'true');
            button.append(mark);
            const flag = safeFlagUrl(lang.flag);
            if (flag) {
                const img = this.element('img', 'core-care-language-menu__flag');
                img.src = flag;
                img.alt = '';
                img.width = 24;
                img.height = 16;
                img.loading = 'lazy';
                img.decoding = 'async';
                button.append(img);
            }
            button.append(this.element('span', 'core-care-language-menu__name', String(lang.name || code.toUpperCase())));
            button.addEventListener('click', () => this.choose(code, current, selected));
            return button;
        });
        this.list.replaceChildren(...items);
    }

    choose(code, current, selected) {
        if (selected) { this.setOpen(false); this.trigger.focus(); return; }
        const salla = window.Salla;
        salla?.cookie?.set?.('s-lang', code);
        const withParam = salla?.helpers?.addParamToUrl ? salla.helpers.addParamToUrl('lang', code) : (() => {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', code);
            return url.href;
        })();
        const next = languageSwitchUrl(withParam, current, code);
        if (next) window.location.href = next;
    }
}

if (!customElements.get('core-care-language-menu')) customElements.define('core-care-language-menu', CoreCareLanguageMenu);
