// Activity bar for AI agents: every change an agent makes through the store's WebMCP tools is shown to the
// shopper with an undo, so nothing happens to the cart out of sight. Markup and labels come from master.twig.

const VISIBLE_MS = 10000;

// Message for one change, from the translated templates (%s = product or coupon, %n = quantity).
export function activityMessage(change, label) {
    const name = String(change?.name || '').trim() || label('ThisProduct');
    const template = label(`Action${String(change?.action || '').replace(/^./, c => c.toUpperCase())}`) || label('ActionDone');
    return template.replace('%s', change?.action === 'coupon' ? String(change.value ?? '') : name).replace('%n', String(change?.value ?? ''));
}

class CoreCareAiActivity extends HTMLElement {
    connectedCallback() {
        if (this.ready) return;
        this.ready = true;
        this.text = this.querySelector('.cc-ai-activity__text');
        this.undoBtn = this.querySelector('[data-ai-undo]');
        this.closeBtn = this.querySelector('[data-ai-close]');
        this.change = null;
        this.undoBtn?.addEventListener('click', () => this.undo());
        this.closeBtn?.addEventListener('click', () => this.hide());
        // Reading or reaching for a button keeps the bar up.
        for (const type of ['mouseenter', 'focusin']) this.addEventListener(type, () => this.pause());
        for (const type of ['mouseleave', 'focusout']) this.addEventListener(type, event => { if (!this.contains(event.relatedTarget)) this.schedule(); });
        this.addEventListener('keydown', event => { if (event.key === 'Escape') this.hide(); });
    }

    label(name) {
        return this.dataset[`label${name}`] || '';
    }

    show(change) {
        if (!this.text) return;
        this.change = change;
        this.text.textContent = activityMessage(change, name => this.label(name));
        this.undoBtn.hidden = typeof change?.undo !== 'function';
        this.undoBtn.disabled = false;
        this.hidden = false;
        this.schedule();
    }

    async undo() {
        const change = this.change;
        if (typeof change?.undo !== 'function' || this.undoBtn.disabled) return;
        this.undoBtn.disabled = true;
        this.pause();
        try {
            await change.undo();
            this.text.textContent = this.label('Undone');
        } catch {
            this.text.textContent = this.label('UndoFailed');
        }
        this.change = null;
        this.undoBtn.hidden = true;
        this.schedule();
    }

    pause() {
        clearTimeout(this.timer);
    }

    schedule() {
        this.pause();
        if (!this.hidden) this.timer = setTimeout(() => this.hide(), VISIBLE_MS);
    }

    hide() {
        this.pause();
        // Keep focus on the page rather than losing it with the hidden bar.
        const hadFocus = this.contains(document.activeElement);
        this.hidden = true;
        this.change = null;
        if (hadFocus) document.getElementById('main-content')?.focus?.({ preventScroll: true });
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('core-care-ai-activity')) customElements.define('core-care-ai-activity', CoreCareAiActivity);
