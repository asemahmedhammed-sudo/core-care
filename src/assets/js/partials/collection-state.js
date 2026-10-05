// Navigation uses only categories already returned for the store header.
function categoryId(value) {
    try {
        const url = new URL(value, window.location.origin);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
        return url.pathname.match(/\/c(\d+)\/?$/)?.[1] || null;
    } catch { return null; }
}

export function categoryNavigation(menus, currentUrl, allLabel) {
    const current = categoryId(currentUrl);
    if (!current) return [];
    let match;
    let siblings;
    const find = (items, depth = 0) => {
        if (!Array.isArray(items) || depth > 12 || match) return;
        for (const item of items) {
            if (!item) continue;
            if (categoryId(item.url) === current) { match = item; siblings = items; return; }
            find(item.children, depth + 1);
            if (match) return;
        }
    };
    find(menus);
    if (!match) return [];
    const children = Array.isArray(match.children) ? match.children.filter(item => item?.title && categoryId(item.url)) : [];
    const group = children.length ? [match, ...children] : siblings;
    const seen = new Set();
    return group.filter(item => {
        const id = categoryId(item?.url);
        if (!id || !item.title || seen.has(id)) return false;
        seen.add(id);
        return true;
    }).map(item => ({ url: item.url, title: item === match && children.length ? allLabel : item.title, active: categoryId(item.url) === current }));
}

export function activeFilterCount(filters, baseCategory) {
    const countValue = value => {
        if (Array.isArray(value)) return value.reduce((sum, item) => sum + countValue(item), 0);
        if (value && typeof value === 'object') {
            if ('min' in value || 'max' in value) return 1;
            return Object.values(value).reduce((sum, item) => sum + countValue(item), 0);
        }
        return value == null || value === '' ? 0 : 1;
    };
    return Object.entries(filters || {}).reduce((sum, [key, value]) => {
        if (key === 'sort') return sum;
        if (key === 'category_id') {
            const categories = Array.isArray(value) ? value : [value];
            return sum + categories.filter(id => id != null && id !== '' && String(id) !== String(baseCategory)).length;
        }
        return sum + countValue(value);
    }, 0);
}
