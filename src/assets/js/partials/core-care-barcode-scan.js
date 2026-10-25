// Barcode search on phones (header button in components/header/header.twig).
// Uses the browser's own BarcodeDetector and camera (Android Chrome and other Chromium browsers);
// where either is missing the button stays hidden. A scanned number opens Salla's search, which
// matches product SKUs, so stores keep each product's barcode in its SKU.
export const PRODUCT_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];

export async function scanFormats(win = globalThis) {
    if (!win.isSecureContext || !win.BarcodeDetector || !win.navigator?.mediaDevices?.getUserMedia) return [];
    try {
        const supported = await win.BarcodeDetector.getSupportedFormats();
        return PRODUCT_FORMATS.filter(format => supported.includes(format));
    } catch { return []; }
}

// Keeps only printable barcode characters, so nothing else reaches the search URL.
export function cleanCode(value) {
    const code = String(value ?? '').trim();
    return /^[0-9A-Za-z\-. ]{4,48}$/.test(code) ? code : '';
}

export function searchHref(base, code) {
    return `${base}${base.includes('?') ? '&' : '?'}q=${encodeURIComponent(code)}`;
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function closeIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 6l12 12M18 6 6 18');
    svg.append(path);
    return svg;
}

class Scanner {
    constructor(button, formats) {
        this.button = button;
        this.formats = formats;
    }

    async open() {
        if (this.dialog) return;
        const { hint, closeLabel, error } = this.button.dataset;
        this.dialog = element('div', 'cc-scanner');
        this.dialog.setAttribute('role', 'dialog');
        this.dialog.setAttribute('aria-modal', 'true');
        this.dialog.setAttribute('aria-label', this.button.getAttribute('aria-label') || '');
        this.video = element('video', 'cc-scanner__video');
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.setAttribute('aria-hidden', 'true');
        const frame = element('div', 'cc-scanner__frame');
        frame.setAttribute('aria-hidden', 'true');
        this.message = element('p', 'cc-scanner__hint', hint);
        this.message.setAttribute('role', 'status');
        const close = element('button', 'cc-scanner__close');
        close.type = 'button';
        close.setAttribute('aria-label', closeLabel || '');
        close.append(closeIcon());
        close.addEventListener('click', () => this.close());
        this.dialog.addEventListener('keydown', event => { if (event.key === 'Escape') this.close(); });
        this.dialog.append(this.video, frame, this.message, close);
        document.body.append(this.dialog);
        document.documentElement.classList.add('cc-scanner-open');
        close.focus();
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            if (!this.dialog) { this.stop(); return; }
            this.video.srcObject = this.stream;
            await this.video.play();
            this.detector = new window.BarcodeDetector({ formats: this.formats });
            this.detect();
        } catch {
            this.stop();
            if (this.message) this.message.textContent = error || '';
        }
    }

    async detect() {
        if (!this.dialog || !this.detector) return;
        try {
            const codes = await this.detector.detect(this.video);
            const code = codes.map(item => cleanCode(item.rawValue)).find(Boolean);
            if (code) {
                navigator.vibrate?.(40);
                const base = this.button.dataset.searchUrl || '/search';
                this.close();
                window.location.href = searchHref(base, code);
                return;
            }
        } catch { /* a frame can fail while the camera warms up */ }
        this.timer = setTimeout(() => this.detect(), 200);
    }

    stop() {
        clearTimeout(this.timer);
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
        this.detector = null;
    }

    close() {
        this.stop();
        this.dialog?.remove();
        this.dialog = null;
        document.documentElement.classList.remove('cc-scanner-open');
        this.button.focus();
    }
}

async function setup() {
    const button = document.querySelector('[data-barcode-scan]');
    if (!button) return;
    const formats = await scanFormats(window);
    if (!formats.length) return;
    const scanner = new Scanner(button, formats);
    button.hidden = false;
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        scanner.open();
    });
    // Leaving the page or switching apps releases the camera.
    document.addEventListener('visibilitychange', () => { if (document.hidden && scanner.dialog) scanner.close(); });
}

if (globalThis.document?.readyState) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
}
