// «اسأل الذكاء الاصطناعي»: opens the shopper's own AI assistant with a ready question about a product or the
// store. Only the question, product name and public link leave the page; nothing about the shopper does.

export const PROVIDERS = {
    chatgpt: 'https://chatgpt.com/?q=',
    claude: 'https://claude.ai/new?q=',
    perplexity: 'https://www.perplexity.ai/search?q=',
};
const PREFERENCE_KEY = 'cc-ask-ai-provider';
const MAX_QUESTION = 300;

// Fills {store}, {name}, {url} and {question} in the translated template; unknown braces stay as written.
export function buildPrompt(template, values) {
    return String(template || '{question}')
        .replace(/\{(store|name|url|question)\}/g, (_, key) => String(values?.[key] ?? '').trim())
        .replace(/[ \t]+\n/g, '\n').trim();
}

export function providerUrl(provider, prompt) {
    const base = PROVIDERS[provider];
    return base ? `${base}${encodeURIComponent(prompt)}` : null;
}

export function safePageUrl(value, base) {
    try {
        const url = new URL(value, base);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
}

function storage() {
    try { return globalThis.localStorage; } catch { return null; }
}

class CoreCareAskAi extends HTMLElement {
    connectedCallback() {
        if (this.ready) return;
        this.ready = true;
        this.field = this.querySelector('[data-ask-ai-custom]');
        this.copyBtn = this.querySelector('[data-ask-ai-copy]');
        this.status = this.querySelector('[data-ask-ai-status]');
        this.links = [...this.querySelectorAll('[data-ask-ai-provider]')];
        this.addEventListener('change', event => {
            // Picking a suggested question replaces a typed one, and the reverse.
            if (event.target.matches('input[type="radio"]') && this.field) this.field.value = '';
            this.update();
        });
        this.field?.addEventListener('input', () => {
            if (this.field.value.trim()) this.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = false; });
            this.update();
        });
        this.links.forEach(link => link.addEventListener('click', event => this.open(event, link)));
        this.copyBtn?.addEventListener('click', () => this.copy());
        this.markPreferred(storage()?.getItem(PREFERENCE_KEY));
        this.update();
    }

    question() {
        const typed = this.field?.value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUESTION);
        return typed || this.querySelector('input[type="radio"]:checked')?.dataset.question || '';
    }

    prompt() {
        return buildPrompt(this.dataset.template, {
            store: this.dataset.store,
            name: this.dataset.name,
            url: safePageUrl(this.dataset.url, window.location.href),
            question: this.question(),
        });
    }

    update() {
        const prompt = this.prompt();
        const ready = Boolean(this.question());
        this.links.forEach(link => {
            link.href = providerUrl(link.dataset.askAiProvider, prompt) || link.href;
            link.setAttribute('aria-disabled', ready ? 'false' : 'true');
        });
        if (this.copyBtn) this.copyBtn.disabled = !ready;
    }

    markPreferred(provider) {
        const preferred = PROVIDERS[provider] ? provider : this.links[0]?.dataset.askAiProvider;
        this.links.forEach(link => link.classList.toggle('is-preferred', link.dataset.askAiProvider === preferred));
    }

    open(event, link) {
        if (!this.question()) { event.preventDefault(); this.field?.focus(); return; }
        this.update();
        try { storage()?.setItem(PREFERENCE_KEY, link.dataset.askAiProvider); } catch { /* Preference is optional. */ }
        this.markPreferred(link.dataset.askAiProvider);
        // Inside Salla's mobile app the link must leave the webview to reach the assistant's app or site.
        const mobile = window.salla?.mobile;
        if (mobile?.isEnabled?.() && typeof mobile.openBrowser === 'function') {
            event.preventDefault();
            mobile.openBrowser({ url: link.href });
        }
    }

    async copy() {
        const prompt = this.prompt();
        if (!this.question()) return;
        let copied = false;
        try { await navigator.clipboard.writeText(prompt); copied = true; } catch {
            // Older webviews: copy through a temporary field.
            const area = document.createElement('textarea');
            area.value = prompt;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.append(area);
            area.select();
            try { copied = document.execCommand('copy'); } catch { copied = false; }
            area.remove();
        }
        if (this.status) {
            this.status.textContent = copied ? this.dataset.labelCopied || '' : this.dataset.labelCopyFailed || '';
            clearTimeout(this.statusTimer);
            this.statusTimer = setTimeout(() => { this.status.textContent = ''; }, 4000);
        }
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('core-care-ask-ai')) customElements.define('core-care-ask-ai', CoreCareAskAi);

// Salla serves every store's MCP server at /mcp on the store's own domain (see /.well-known/mcp.json).
export function storeMcpUrl(storeUrl) {
    try {
        const url = new URL(storeUrl);
        return url.protocol === 'https:' && !url.username && !url.password ? `${url.origin}/mcp` : '';
    } catch { return ''; }
}

// The «تسوّق بمساعدك الذكي» page: the store's MCP address with a copy button, and whether this browser has WebMCP.
export function initAiPage(doc = globalThis.document) {
    const box = doc?.querySelector?.('[data-ai-mcp]');
    const address = storeMcpUrl(box?.dataset.storeUrl);
    if (box && address) {
        box.querySelector('[data-ai-mcp-url]').textContent = address;
        const button = box.querySelector('[data-ai-copy-value]');
        const label = button.textContent;
        button.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(address); } catch { return; }
            button.textContent = button.dataset.labelCopied || label;
            setTimeout(() => { button.textContent = label; }, 2500);
        });
        box.hidden = false;
    }
    const status = doc?.querySelector?.('[data-ai-browser-status]');
    if (status) {
        const ready = Boolean(doc.modelContext || globalThis.navigator?.modelContext);
        status.textContent = ready ? status.dataset.labelReady : status.dataset.labelNotReady;
        status.classList.toggle('is-ready', ready);
        status.hidden = false;
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAiPage(document), { once: true });
    else initAiPage(document);
}
