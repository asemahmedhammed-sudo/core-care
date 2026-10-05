import BasePage from './base-page';
import { categoryNavigation, activeFilterCount } from './partials/collection-state';

class Products extends BasePage {
    onReady() {
        const root = document.querySelector('[data-collection-page]');
        if (!root || root.dataset.initialized) return;
        root.dataset.initialized = 'true';
        const list = root.querySelector('salla-products-list');
        const sort = root.querySelector('#product-filter');
        if (sort && list) {
            const saved = new URLSearchParams(window.location.search).get('sort');
            if (Array.from(sort.options).some(option => option.value === saved)) {
                sort.value = saved;
                if (list.sortBy && list.sortBy !== saved) {
                    list.sortBy = saved;
                    list.reload();
                }
            }
            sort.addEventListener('change', async () => {
                const url = new URL(window.location.href);
                url.searchParams.set('sort', sort.value);
                window.history.replaceState(null, '', url);
                list.sortBy = sort.value;
                // reload retains the platform's parsed filters and pagination state.
                await list.reload();
            });
        }
        this.initCategories(root);
        this.initFilters(root);
    }

    initCategories(root) {
        const nav = root.querySelector('[data-collection-categories]');
        const menu = document.querySelector('core-care-categories');
        if (!nav || !menu) return;
        const sync = () => {
            if (!Array.isArray(menu.menus)) return;
            observer.disconnect();
            const items = categoryNavigation(menu.menus, root.dataset.categoryUrl, nav.dataset.allLabel);
            if (!items.length) return;
            nav.replaceChildren(...items.map(item => {
                const link = document.createElement('a');
                link.className = 'core-collection-chip';
                link.href = item.url;
                link.textContent = item.title;
                if (item.active) link.setAttribute('aria-current', 'page');
                return link;
            }));
        };
        // Reuse the header's existing menu response, without a second feed request.
        const observer = new MutationObserver(sync);
        observer.observe(menu, { childList: true });
        sync();
    }

    initFilters(root) {
        const filters = root.querySelector('salla-filters');
        const panel = root.querySelector('.core-collection-filters');
        const home = root.querySelector('[data-filter-home]');
        const dialog = root.querySelector('dialog');
        const trigger = root.querySelector('[data-filter-open]');
        if (!filters || !panel || !dialog || !trigger) return;
        const desktop = window.matchMedia('(min-width: 1024px)');
        const close = () => { if (dialog.open) dialog.close(); };
        trigger.addEventListener('click', () => {
            dialog.append(panel);
            dialog.showModal();
            document.body.classList.add('core-collection-dialog-open');
            trigger.setAttribute('aria-expanded', 'true');
        });
        dialog.addEventListener('close', () => {
            home.append(panel);
            document.body.classList.remove('core-collection-dialog-open');
            trigger.setAttribute('aria-expanded', 'false');
            if (!desktop.matches) trigger.focus();
        });
        dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
        root.querySelector('[data-filter-close]').addEventListener('click', close);
        root.querySelector('[data-filter-apply]').addEventListener('click', close);
        desktop.addEventListener('change', () => { if (desktop.matches) close(); });
        root.querySelectorAll('[data-filter-reset]').forEach(button => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                try { await filters.resetFilters(); }
                finally { button.disabled = false; }
            });
        });
        const syncCount = async () => {
            const count = activeFilterCount(await filters.getFilters(), salla.config.get('page.id'));
            const badge = trigger.querySelector('[data-filter-count]');
            badge.textContent = salla.helpers.number(count);
            badge.hidden = count === 0;
            root.dataset.filtersActive = String(count > 0);
        };
        salla.event.on('salla-filters::changed', syncCount);
        filters.componentOnReady().then(syncCount);
        const enhance = () => {
            root.dataset.filtersAvailable = String(filters.style.display !== 'none' && !!filters.querySelector('salla-filters-widget'));
            filters.querySelectorAll('salla-filters-widget').forEach((widget, index) => {
                const title = widget.querySelector('.s-filters-widget-title');
                const content = widget.querySelector('.s-filters-widget-content');
                if (!title || !content) return;
                content.id = `collection-filter-group-${index}`;
                title.setAttribute('role', 'button');
                title.tabIndex = 0;
                title.setAttribute('aria-controls', content.id);
                title.setAttribute('aria-expanded', String(!content.classList.contains('s-filters-widget-closed')));
                const search = widget.querySelector('.s-filters-widget-search-input');
                if (search) search.setAttribute('aria-label', title.textContent.trim());
            });
        };
        filters.addEventListener('keydown', event => {
            const title = event.target.closest('.s-filters-widget-title');
            if (title && ['Enter', ' '].includes(event.key)) {
                event.preventDefault();
                title.click();
            }
        });
        new MutationObserver(enhance).observe(filters, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
        enhance();
    }
}

Products.initiateWhenReady([
    'product.index', 'product.index.latest', 'product.index.offers',
    'product.index.search', 'product.index.tag', 'product.index.sales',
]);
