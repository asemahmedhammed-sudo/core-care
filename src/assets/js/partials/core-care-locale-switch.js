// «حسابي» sheet: language and currency switch in place (mobile-account.twig), without opening another panel.
// Options come from Salla at runtime; one tap applies the choice the same way salla-localization-modal does.
import { storeLanguages, switchLanguage } from './core-care-language-menu';

// Salla returns currencies as an object keyed by code; keep entries that carry a usable code.
export function currencyOptions(currencies, current) {
    const list = Array.isArray(currencies) ? currencies : Object.values(currencies || {});
    return list
        .filter(currency => currency && typeof currency.code === 'string' && /^[A-Z]{3}$/.test(currency.code))
        .map(currency => ({ code: currency.code, label: currency.code, name: typeof currency.name === 'string' ? currency.name : '', selected: currency.code === current }));
}

export function languageOptions(languages, current) {
    return (languages || []).map(lang => {
        const code = String(lang.code || lang.iso_code);
        return { code, label: String(lang.name || code.toUpperCase()), name: '', selected: code === current || lang.iso_code === current };
    });
}

class CoreCareLocaleSwitch extends HTMLElement {
    connectedCallback() {
        if (this.loading) return;
        this.loading = this.load().catch(() => {
            this.loading = null;
            const status = document.createElement('span');
            status.className = 'cc-account__choices-status';
            status.textContent = this.dataset.errorLabel || '';
            this.replaceChildren(status);
        });
    }

    async load() {
        const salla = window.Salla;
        if (this.dataset.kind === 'currency') {
            if (!salla?.config?.currencies) throw new Error('Salla unavailable');
            await salla.onReady?.();
            const current = salla.config.get?.('user.currency_code', 'SAR');
            this.render(currencyOptions(await salla.config.currencies(), current), code => this.changeCurrency(code));
        } else {
            const current = this.dataset.current || salla?.config?.get?.('user.language_code');
            this.render(languageOptions(await storeLanguages(), current), code => switchLanguage(code, current));
        }
    }

    render(options, apply) {
        // A single option is no choice: the row releases its space.
        const row = this.closest('[data-locale-row]');
        if (row) row.hidden = options.length < 2;
        this.replaceChildren(...options.map(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cc-account__choice';
            button.setAttribute('aria-pressed', String(option.selected));
            if (this.dataset.kind !== 'currency') button.lang = option.code;
            if (option.name) button.title = option.name;
            button.textContent = option.label;
            button.addEventListener('click', () => {
                if (option.selected || this.hasAttribute('aria-busy')) return;
                this.setAttribute('aria-busy', 'true');
                button.dataset.pending = 'true';
                Promise.resolve(apply(option.code)).catch(() => {
                    this.removeAttribute('aria-busy');
                    delete button.dataset.pending;
                });
            });
            return button;
        }));
    }

    async changeCurrency(code) {
        const salla = window.Salla;
        await salla.currency.api.change(code);
        salla.cookie?.set?.('s-curr', code);
        window.location.reload();
    }
}

if (!customElements.get('core-care-locale-switch')) customElements.define('core-care-locale-switch', CoreCareLocaleSwitch);
