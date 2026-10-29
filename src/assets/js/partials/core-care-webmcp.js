// WebMCP: exposes the store to in-browser AI agents as structured tools (https://webmachinelearning.github.io/webmcp/).
// Every tool goes through the Salla SDK, so prices, stock and the cart stay platform-driven and the page UI
// (cart badge, drawer, notifier) updates exactly as it does for a shopper. Checkout, payment and customer
// data are deliberately not exposed: the shopper finishes those on Salla's own pages.

export const TOOL_PREFIX = 'corecare_';
const OUTPUT_BUDGET = 1500;
const DESCRIPTION_BUDGET = 600;

export class ToolInputError extends Error {}

export function modelContextOf(doc = globalThis.document, nav = globalThis.navigator) {
    // document.modelContext is canonical; Chrome 146-149 builds only had navigator.modelContext.
    const context = doc?.modelContext || nav?.modelContext;
    return typeof context?.registerTool === 'function' ? context : null;
}

export function integerInput(value, name, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
    const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (!Number.isInteger(number) || number < min || number > max) {
        throw new ToolInputError(`"${name}" must be a whole number from ${min} to ${max}.`);
    }
    return number;
}

export function textInput(value, name, { max = 100 } = {}) {
    const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    if (!text) throw new ToolInputError(`"${name}" is required.`);
    if (text.length > max) throw new ToolInputError(`"${name}" must be at most ${max} characters.`);
    return text;
}

// Salla's cart API takes options as { [option_id]: value_id }, or free text for text-type options.
export function optionsInput(value) {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new ToolInputError('"options" must map option_id to value_id, e.g. {"123": 456}.');
    }
    const options = {};
    for (const [key, raw] of Object.entries(value)) {
        const id = integerInput(key, 'option_id');
        options[id] = typeof raw === 'string' && !/^\d+$/.test(raw.trim()) ? textInput(raw, `options.${id}`, { max: 200 }) : integerInput(raw, `options.${id}`);
    }
    return Object.keys(options).length ? options : undefined;
}

export function plainText(html, max = DESCRIPTION_BUDGET) {
    const text = String(html ?? '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function safeUrl(value, base) {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    try {
        const url = new URL(value, base);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
    } catch { return undefined; }
}

function amount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

// Only values Salla returned; absent fields are dropped rather than guessed.
export function compactProduct(product, base) {
    if (!product || product.id === undefined || product.id === null) return null;
    const regular = amount(product.regular_price);
    const sale = amount(product.sale_price);
    const onSale = Boolean(product.is_on_sale) && regular !== undefined && sale !== undefined && sale < regular;
    const rating = product.rating && Number(product.rating.count) > 0
        ? { stars: amount(product.rating.stars ?? product.rating.rate), count: Number(product.rating.count) }
        : undefined;
    return prune({
        product_id: Number(product.id),
        name: product.name ? String(product.name) : undefined,
        brand: product.brand?.name ? String(product.brand.name) : undefined,
        price: onSale ? sale : amount(product.price),
        regular_price: onSale ? regular : undefined,
        starting_price: product.starting_price ? amount(product.starting_price) : undefined,
        currency: product.currency || undefined,
        available: product.is_available === undefined ? (product.is_out_of_stock === undefined ? undefined : !product.is_out_of_stock) : Boolean(product.is_available),
        has_options: product.has_options === undefined ? undefined : Boolean(product.has_options),
        rating,
        url: safeUrl(product.url, base),
    });
}

export function compactOptions(options) {
    return (Array.isArray(options) ? options : []).map(option => prune({
        option_id: Number(option.id),
        name: option.name ? String(option.name) : undefined,
        type: option.type || undefined,
        required: Boolean(option.required),
        values: (Array.isArray(option.details) ? option.details : []).map(detail => prune({
            value_id: Number(detail.id),
            name: String(detail.name ?? detail.option_value ?? ''),
            extra_price: amount(detail.additional_price) || undefined,
            sold_out: detail.is_out ? true : undefined,
        })),
    })).filter(option => Number.isInteger(option.option_id));
}

export function missingRequiredOptions(options, chosen = {}) {
    return compactOptions(options).filter(option => option.required && !(option.option_id in chosen)).map(option => option.name || String(option.option_id));
}

export function compactCart(cart, base) {
    const items = (Array.isArray(cart?.items) ? cart.items : []).filter(Boolean);
    return prune({
        item_count: Number(cart?.count) || items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        sub_total: amount(cart?.sub_total),
        discount: amount(cart?.discount) || undefined,
        total: amount(cart?.total),
        free_shipping_remaining: cart?.free_shipping_bar && !cart.free_shipping_bar.has_free_shipping ? amount(cart.free_shipping_bar.remaining) : undefined,
        items: items.map(item => prune({
            item_id: Number(item.id),
            product_id: Number(item.product_id) || undefined,
            name: item.product_name ? String(item.product_name) : undefined,
            quantity: Number(item.quantity) || 0,
            price: amount(item.price),
            total: amount(item.total),
            available: item.is_available === false ? false : undefined,
            url: safeUrl(item.url, base),
        })),
    });
}

function prune(object) {
    return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

// Keeps tool output inside the recommended budget by dropping trailing list entries, never by cutting JSON.
export function toolOutput(data, budget = OUTPUT_BUDGET) {
    let payload = { ...data };
    let text = JSON.stringify(payload);
    const listKey = ['products', 'items', 'categories'].find(key => Array.isArray(payload[key]));
    while (text.length > budget && listKey && payload[listKey].length > 1) {
        payload = { ...payload, [listKey]: payload[listKey].slice(0, -1), truncated: true };
        text = JSON.stringify(payload);
    }
    return text;
}

export function errorOutput(error) {
    if (error instanceof ToolInputError) return toolOutput({ ok: false, error: error.message });
    if (error?.name === 'AbortError') return toolOutput({ ok: false, error: 'Cancelled.' });
    if (/CartNotCreated/.test(`${error?.name} ${error?.message} ${error}`)) return toolOutput({ ok: true, cart: { item_count: 0, items: [] } });
    // Salla responds with a translated, shopper-facing reason (stock limit, invalid coupon, …).
    const message = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message;
    return toolOutput({ ok: false, error: message ? String(message).slice(0, 300) : 'The store could not complete this request. Try again or continue on the page.' });
}

const SORTS = {
    relevance: 'ourSuggest',
    best_selling: 'bestSell',
    top_rated: 'topRated',
    price_low_to_high: 'priceFromLowToTop',
    price_high_to_low: 'priceFromTopToLow',
};

// The page's own product, from the product form Salla renders on product.single.
export function currentProductId(doc, salla) {
    const field = doc?.querySelector?.('.product-form input[name="id"]');
    const id = Number(field?.value || (salla?.config?.get?.('page.slug') === 'product.single' ? salla.config.get('page.id') : NaN));
    return Number.isInteger(id) && id > 0 ? id : undefined;
}

// Quantity of every cart line, so an agent's change can be put back exactly.
export function cartQuantities(cart) {
    return new Map((Array.isArray(cart?.items) ? cart.items : []).filter(Boolean).map(item => [Number(item.id), Number(item.quantity) || 0]));
}

// The line an add changed: a new line, or an existing line of the same product that grew.
export function changedLine(before, cart, productId) {
    const lines = (Array.isArray(cart?.items) ? cart.items : []).filter(item => Number(item?.product_id) === productId);
    return lines.find(item => !before.has(Number(item.id))) || lines.find(item => (Number(item.quantity) || 0) > (before.get(Number(item.id)) || 0));
}

// Salla's own WebMCP tools (Twilight 3) run when the platform renders webmcp.enabled; same test as the SDK.
export function sallaToolsEnabled(salla) {
    const value = salla?.config?.get?.('webmcp.enabled');
    return value === true || value === 'true' || value === 1 || value === '1';
}

// Tools Salla's set has no equivalent for; registered alongside Salla's tools when the theme defers to them.
export const COMPLEMENTARY_TOOLS = ['list_categories', 'add_to_wishlist', 'open_cart_page'].map(name => `${TOOL_PREFIX}${name}`);

// One set of shopping tools per page. With theme tools first (the default), Salla's duplicates are switched off
// for this page so every agent change shows in the activity bar with an undo; otherwise the theme only adds
// what Salla's set lacks.
export async function chooseToolSet(salla, themeFirst) {
    if (!sallaToolsEnabled(salla)) return { only: undefined, source: 'theme' };
    if (!themeFirst || typeof salla?.webmcp?.disable !== 'function') return { only: COMPLEMENTARY_TOOLS, source: 'salla' };
    // Salla enables its tools on twilight::initiated; let that run first so disable() has something to release.
    await new Promise(resolve => setTimeout(resolve, 0));
    salla.webmcp.disable();
    return { only: undefined, source: 'theme' };
}

// notify({ action, name, value, undo }) reports each change an agent makes, so the page can show it with an undo.
export function storeTools(salla, { doc = globalThis.document, location = globalThis.location, notify = () => {} } = {}) {
    const base = () => location?.href;
    const report = change => { try { notify(change); } catch { /* The notice is a courtesy; the tool result stands. */ } };
    const guard = () => { if (!salla?.cart || !salla?.product) throw new Error('The store is still loading. Try again in a moment.'); };
    const cartDetails = async () => {
        try {
            const response = await salla.cart.details(null, ['options']);
            return response?.data?.cart || response?.data || {};
        } catch (error) {
            if (/CartNotCreated/.test(`${error?.name} ${error?.message} ${error}`)) return { items: [] };
            throw error;
        }
    };
    const productDetails = async id => (await salla.product.getDetails(id, ['images', 'brand', 'rating', 'options', 'category']))?.data;

    return [
        {
            name: `${TOOL_PREFIX}search_products`,
            title: 'Search products',
            description: 'Search the Core Care beauty and personal-care catalogue. Accepts Arabic or English keywords (product, brand or concern, e.g. "serum", "سيروم فيتامين سي"). Returns matching products with product_id, price, availability and link. Use product_id with the other tools.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search words as the shopper said them, in Arabic or English.' },
                    sort: { type: 'string', enum: Object.keys(SORTS), description: 'Result order. Default: relevance.' },
                    limit: { type: 'integer', minimum: 1, maximum: 12, description: 'How many products to return. Default: 6.' },
                },
                required: ['query'],
            },
            annotations: { readOnlyHint: true },
            async execute(input) {
                guard();
                const query = textInput(input?.query, 'query');
                const sort = input?.sort === undefined ? 'relevance' : input.sort;
                if (!(sort in SORTS)) throw new ToolInputError(`"sort" must be one of: ${Object.keys(SORTS).join(', ')}.`);
                const limit = input?.limit === undefined ? 6 : integerInput(input.limit, 'limit', { max: 12 });
                const request = () => salla.product.search({ query, sort_by: SORTS[sort], per_page: limit });
                let response;
                try { response = await request(); } catch (error) {
                    // The SDK refuses a query equal to the previous one once, then clears it.
                    if (!/same as previous/i.test(String(error?.message ?? error))) throw error;
                    response = await request();
                }
                const products = (Array.isArray(response?.data) ? response.data : []).slice(0, limit).map(product => compactProduct(product, base())).filter(Boolean);
                return toolOutput({ ok: true, query, total: Number(response?.cursor?.count) || products.length, products });
            },
        },
        {
            name: `${TOOL_PREFIX}get_product`,
            title: 'Product details',
            description: 'Get one product\'s details: description, price, availability, brand, rating and the options (size, shade, …) needed before adding it to the cart. Omit product_id to use the product page the shopper is viewing.',
            inputSchema: {
                type: 'object',
                properties: {
                    product_id: { type: 'integer', description: 'From search results. Optional on a product page.' },
                },
            },
            annotations: { readOnlyHint: true },
            async execute(input) {
                guard();
                const id = input?.product_id === undefined ? currentProductId(doc, salla) : integerInput(input.product_id, 'product_id');
                if (!id) throw new ToolInputError('"product_id" is required when the shopper is not on a product page.');
                const product = await productDetails(id);
                if (!product) throw new Error('Product not found.');
                const details = prune({
                    ...compactProduct(product, base()),
                    category: product.category?.name || undefined,
                    max_quantity: Number(product.max_quantity) > 0 ? Number(product.max_quantity) : undefined,
                    options: compactOptions(product.options),
                });
                // The description gets whatever room the facts leave, so options are never cut.
                const room = OUTPUT_BUDGET - JSON.stringify({ ok: true, product: details }).length - 20;
                const description = room > 80 ? plainText(product.description, Math.min(DESCRIPTION_BUDGET, room)) : '';
                return toolOutput({ ok: true, product: prune({ ...details, description }) });
            },
        },
        {
            name: `${TOOL_PREFIX}list_categories`,
            title: 'Browse categories',
            description: 'List the store\'s product categories with their sub-categories and links, to help the shopper browse a section such as skincare, hair care or perfumes.',
            inputSchema: { type: 'object', properties: {} },
            annotations: { readOnlyHint: true },
            async execute() {
                guard();
                const response = await salla.product.categories();
                const list = Array.isArray(response?.data) ? response.data : [response?.data].filter(Boolean);
                const categories = list.map(category => prune({
                    name: category.name ? String(category.name) : undefined,
                    url: safeUrl(category.url, base()),
                    sub: (category.sub_categories || []).map(sub => sub?.name).filter(Boolean).slice(0, 8),
                }));
                return toolOutput({ ok: true, categories });
            },
        },
        {
            name: `${TOOL_PREFIX}view_cart`,
            title: 'View cart',
            description: 'Show the shopper\'s current cart: items with item_id, quantities, prices, totals and how much is left for free shipping.',
            inputSchema: { type: 'object', properties: {} },
            annotations: { readOnlyHint: true },
            async execute() {
                guard();
                return toolOutput({ ok: true, cart: compactCart(await cartDetails(), base()) });
            },
        },
        {
            name: `${TOOL_PREFIX}add_to_cart`,
            title: 'Add to cart',
            description: 'Add a product to the shopper\'s cart. For products with required options, first call get_product and pass the chosen value_id for each option_id. The shopper sees every change on the page and can undo it, so call view_cart before relying on an earlier cart.',
            inputSchema: {
                type: 'object',
                properties: {
                    product_id: { type: 'integer', description: 'Product to add. Optional on a product page.' },
                    quantity: { type: 'integer', minimum: 1, maximum: 50, description: 'Default: 1.' },
                    options: { type: 'object', description: 'Map of option_id to value_id from get_product, e.g. {"123": 456}.', additionalProperties: { type: ['integer', 'string'] } },
                },
            },
            async execute(input) {
                guard();
                const id = input?.product_id === undefined ? currentProductId(doc, salla) : integerInput(input.product_id, 'product_id');
                if (!id) throw new ToolInputError('"product_id" is required when the shopper is not on a product page.');
                const quantity = input?.quantity === undefined ? 1 : integerInput(input.quantity, 'quantity', { max: 50 });
                const options = optionsInput(input?.options);
                const product = await productDetails(id);
                if (!product) throw new Error('Product not found.');
                const missing = missingRequiredOptions(product.options, options);
                if (missing.length) {
                    return toolOutput({ ok: false, error: `Choose these options first: ${missing.join(', ')}.`, options: compactOptions(product.options) });
                }
                if (product.is_available === false || product.is_out_of_stock) {
                    return toolOutput({ ok: false, error: 'This product is out of stock.', product_id: id });
                }
                const before = cartQuantities(await cartDetails());
                const response = await salla.cart.addItem(prune({ id, quantity, options }));
                const cart = response?.data?.cart?.items ? response.data.cart : await cartDetails();
                const line = changedLine(before, cart, id);
                report({
                    action: 'added', name: product.name, value: quantity,
                    undo: line ? () => (before.has(Number(line.id))
                        ? salla.cart.updateItem({ id: Number(line.id), quantity: before.get(Number(line.id)) })
                        : salla.cart.deleteItem(Number(line.id))) : null,
                });
                return toolOutput({ ok: true, added: { product_id: id, name: product.name, quantity }, cart: compactCart(cart, base()) });
            },
        },
        {
            name: `${TOOL_PREFIX}update_cart_item`,
            title: 'Change cart quantity',
            description: 'Change the quantity of an item already in the cart. Use item_id from view_cart. To take an item out, use remove_cart_item.',
            inputSchema: {
                type: 'object',
                properties: {
                    item_id: { type: 'integer', description: 'Cart item_id from view_cart.' },
                    quantity: { type: 'integer', minimum: 1, maximum: 50 },
                },
                required: ['item_id', 'quantity'],
            },
            async execute(input) {
                guard();
                const id = integerInput(input?.item_id, 'item_id');
                const quantity = integerInput(input?.quantity, 'quantity', { max: 50 });
                const line = (await cartDetails()).items?.find(item => Number(item?.id) === id);
                if (!line) throw new ToolInputError('No cart item has this item_id. Call view_cart for the current items.');
                const previous = Number(line.quantity) || 1;
                const response = await salla.cart.updateItem({ id, quantity });
                if (previous !== quantity) {
                    report({ action: 'updated', name: line.product_name, value: quantity, undo: () => salla.cart.updateItem({ id, quantity: previous }) });
                }
                return toolOutput({ ok: true, cart: compactCart(response?.data?.cart || await cartDetails(), base()) });
            },
        },
        {
            name: `${TOOL_PREFIX}remove_cart_item`,
            title: 'Remove from cart',
            description: 'Remove one item from the cart. Use item_id from view_cart.',
            inputSchema: {
                type: 'object',
                properties: { item_id: { type: 'integer', description: 'Cart item_id from view_cart.' } },
                required: ['item_id'],
            },
            async execute(input) {
                guard();
                const id = integerInput(input?.item_id, 'item_id');
                const line = (await cartDetails()).items?.find(item => Number(item?.id) === id);
                if (!line) throw new ToolInputError('No cart item has this item_id. Call view_cart for the current items.');
                await salla.cart.deleteItem(id);
                // Lines with chosen options, files or notes cannot be rebuilt faithfully, so they get no undo.
                const restorable = Number(line.product_id) > 0 && !line.options?.length && !line.attachments?.length && !line.notes;
                report({
                    action: 'removed', name: line.product_name,
                    undo: restorable ? () => salla.cart.addItem({ id: Number(line.product_id), quantity: Number(line.quantity) || 1 }) : null,
                });
                return toolOutput({ ok: true, cart: compactCart(await cartDetails(), base()) });
            },
        },
        {
            name: `${TOOL_PREFIX}apply_coupon`,
            title: 'Apply coupon',
            description: 'Apply a discount coupon code the shopper gave you to the cart. Returns the updated totals, or the store\'s reason when the code is not valid.',
            inputSchema: {
                type: 'object',
                properties: { code: { type: 'string', description: 'Coupon code exactly as the shopper typed it.' } },
                required: ['code'],
            },
            async execute(input) {
                guard();
                const code = textInput(input?.code, 'code', { max: 40 });
                await salla.cart.addCoupon(code);
                report({ action: 'coupon', value: code, undo: () => salla.cart.deleteCoupon() });
                return toolOutput({ ok: true, coupon: code, cart: compactCart(await cartDetails(), base()) });
            },
        },
        {
            name: `${TOOL_PREFIX}add_to_wishlist`,
            title: 'Save to wishlist',
            description: 'Save a product to the signed-in shopper\'s wishlist. Shoppers who are not signed in are asked to sign in on the page.',
            inputSchema: {
                type: 'object',
                properties: { product_id: { type: 'integer', description: 'Product to save. Optional on a product page.' } },
            },
            async execute(input) {
                if (!salla?.wishlist) throw new Error('The store is still loading. Try again in a moment.');
                const id = input?.product_id === undefined ? currentProductId(doc, salla) : integerInput(input.product_id, 'product_id');
                if (!id) throw new ToolInputError('"product_id" is required when the shopper is not on a product page.');
                if (salla.config?.isGuest?.()) {
                    salla.event?.dispatch?.('login::open');
                    return toolOutput({ ok: false, error: 'The shopper needs to sign in first. The sign-in window is open on the page.' });
                }
                await salla.wishlist.add(id);
                const name = currentProductId(doc, salla) === id ? doc?.querySelector?.('.core-product-title')?.textContent?.trim() : undefined;
                report({ action: 'wishlist', name, undo: () => salla.wishlist.remove(id) });
                return toolOutput({ ok: true, product_id: id });
            },
        },
        {
            name: `${TOOL_PREFIX}open_cart_page`,
            title: 'Go to cart',
            description: 'Open the cart page so the shopper can review the order and complete checkout and payment themselves.',
            inputSchema: { type: 'object', properties: {} },
            async execute() {
                const url = safeUrl(salla?.url?.get?.('cart'), base());
                if (!url) throw new Error('The cart page link is not available.');
                setTimeout(() => location.assign(url), 0);
                return toolOutput({ ok: true, navigating_to: url });
            },
        },
    ];
}

// Wraps execute so invalid input and Salla failures come back as readable results the agent can act on.
export function withErrorHandling(tool) {
    return {
        ...tool,
        async execute(input, options) {
            if (options?.signal?.aborted) return errorOutput({ name: 'AbortError' });
            try { return await tool.execute(input || {}, options); } catch (error) { return errorOutput(error); }
        },
    };
}

export async function registerStoreTools(modelContext, salla, { signal, log = () => {}, only, ...env } = {}) {
    const registered = [];
    for (const tool of storeTools(salla, env).filter(tool => !only || only.includes(tool.name))) {
        try {
            // Same-origin only: no exposedTo, so other sites and embedding frames cannot call these tools.
            await modelContext.registerTool(withErrorHandling(tool), signal ? { signal } : undefined);
            registered.push(tool.name);
        } catch (error) {
            log(`WebMCP: ${tool.name} not registered (${error?.message || error})`);
        }
    }
    return registered;
}
