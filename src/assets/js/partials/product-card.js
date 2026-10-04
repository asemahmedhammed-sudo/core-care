import BasePage from '../base-page';
class ProductCard extends HTMLElement {
  constructor(){
    super()
  }
  
  connectedCallback(){
    // Salla product payload is structured data, but may contain merchant text.
    try {
      this.product = this.product || JSON.parse(this.getAttribute('product'));
    } catch (_) {
      return;
    }
    if (!this.product || !this.product.id) return; 

    if (window.app?.status === 'ready') {
      this.onReady();
    } else {
      document.addEventListener('theme::ready', () => this.onReady() )
    }
  }

  onReady(){
      const fit = salla.config.get('store.settings.product.fit_type');
      this.fitImageHeight = ['cover', 'contain'].includes(fit) ? fit : null;
      this.placeholder = salla.url.asset(salla.config.get('theme.settings.placeholder'));
      this.getProps()

      salla.lang.onLoaded(() => {
        // Language
        this.remained = salla.lang.get('pages.products.remained');
        this.donationAmount = salla.lang.get('pages.products.donation_amount');
        this.startingPrice = salla.lang.get('pages.products.starting_price');
        this.addToCart = salla.lang.get('pages.cart.add_to_cart');
        this.outOfStock = salla.lang.get('pages.products.out_of_stock');

        // re-render to update translations
        this.render();
      })
      
      this.render()
  }

  initCircleBar() {
    let qty = this.product.quantity,
      total = this.product.quantity > 100 ? this.product.quantity * 2 : 100,
      roundPercent = (qty / total) * 100,
      bar = this.querySelector('.s-product-card-content-pie-svg-bar'),
      strokeDashOffsetValue = 100 - roundPercent;
    bar.style.strokeDashoffset = strokeDashOffsetValue;
  }

  formatDate(date) {
    let d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  } 

  getProductBadge() {
    // Explicit opt-in; absent settings on existing stores stay hidden too.
    const showPromotion = document.body?.dataset?.beautyShowProductPromotionTitles === 'true';
    if (this.product?.preorder?.label) {
      return `<div class="s-product-card-promotion-title">${this.escapeHTML(this.product.preorder.label)}</div>`
    }

    if (this.closest?.('.beauty-product-section')) {
      const regular = Number(this.product.regular_price);
      const sale = Number(this.product.sale_price);
      if (this.product.is_on_sale && Number.isFinite(regular) && Number.isFinite(sale) && regular > 0 && sale >= 0 && sale < regular) {
        const discount = Math.floor((regular - sale) / regular * 100);
        if (discount > 0) return `<div class="s-product-card-promotion-title"><bdi>−${discount}%</bdi></div>`;
      }
      const promotion = String(this.product.promotion_title || '').trim();
      if (showPromotion && promotion) {
        return `<div class="s-product-card-promotion-title">${this.escapeHTML(promotion)}</div>`;
      }
      return '';
    }

    if (showPromotion && this.product.promotion_title) {
      return `<div class="s-product-card-promotion-title">${this.escapeHTML(this.product.promotion_title)}</div>`
    }
    if (this.showQuantity && this.product?.quantity) {
      return `<div
        class="s-product-card-quantity">${this.escapeHTML(this.remained)} ${salla.helpers.number(this.product?.quantity)}</div>`
    }
    if (this.showQuantity && this.product?.is_out_of_stock) {
      return `<div class="s-product-card-out-badge">${this.escapeHTML(this.outOfStock)}</div>`
    }
    return '';
  }

  getPriceFormat(price) {
    if (!price || price == 0) {
      return salla.config.get('store.settings.product.show_price_as_dash')?'-':'';
    }

    // Salla's SAR formatter returns this specific icon; keep all other HTML escaped.
    return this.escapeHTML(salla.money(price)).replace(/&lt;i class=(?:&quot;|&#39;)?sicon-sar(?:&quot;|&#39;)?&gt;&lt;\/i&gt;/g, '<i class="sicon-sar" aria-hidden="true"></i>');
  }

  getProductPrice() {
    let price = '';
    if (this.product.is_on_sale) {
      price = `<div class="s-product-card-sale-price">
                <h4>${this.getPriceFormat(this.product.sale_price)}</h4>
                <span>${this.getPriceFormat(this.product?.regular_price)}</span>
              </div>`;
    }
    else if (this.product.starting_price) {
      price = `<div class="s-product-card-starting-price">
                  <p>${this.escapeHTML(this.startingPrice)}</p>
                  <h4> ${this.getPriceFormat(this.product?.starting_price)} </h4>
              </div>`
    }
    else{
      price = `<h4 class="s-product-card-price">${this.getPriceFormat(this.product?.price)}</h4>`
    }

    return price;
  }

  getAddButtonLabel() {
    if(this.product.has_preorder_campaign) {
        return salla.lang.get('pages.products.pre_order_now');
    }

    if (this.product.status === 'sale' && this.product.type === 'booking') {
      return salla.lang.get('pages.cart.book_now');
    }

    if (this.product.status === 'sale') {
      return this.closest?.('.beauty-product-section')?.dataset.addToCartLabel || salla.lang.get('pages.cart.add_to_cart');
    }

    if (this.product.type !== 'donating') {
      return salla.lang.get('pages.products.out_of_stock');
    }

    // donating
    return salla.lang.get('pages.products.donation_exceed');
  }

  getProps(){

    /**
     *  Horizontal card.
     */
    this.horizontal = this.hasAttribute('horizontal');
  
    /**
     *  Support shadow on hover.
     */
    this.shadowOnHover = this.hasAttribute('shadowOnHover');
  
    /**
     *  Hide add to cart button.
     */
    this.hideAddBtn = this.hasAttribute('hideAddBtn');
  
    /**
     *  Full image card.
     */
    this.fullImage = this.hasAttribute('fullImage');
  
    /**
     *  Minimal card.
     */
    this.minimal = this.hasAttribute('minimal');
  
    /**
     *  Special card.
     */
    this.isSpecial = this.hasAttribute('isSpecial');
  
    /**
     *  Show quantity.
     */
    this.showQuantity = this.hasAttribute('showQuantity');
  }

  escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  }

  safeUrl(value) {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? this.escapeHTML(url.href) : '#';
    } catch (_) {
      return '#';
    }
  }

  getRecommendationMoney(price) {
    const formatted = this.getPriceFormat(price);
    const sarIcon = '<i class="sicon-sar" aria-hidden="true"></i>';
    const currency = salla.config.currency?.()?.code;
    if (!formatted || (currency && currency !== 'SAR')) return formatted;
    if (currency === 'SAR' || formatted.includes(sarIcon)) {
      const amount = formatted.replace(sarIcon, '').replace(/(?:SAR|ر\.س|ريال(?: سعودي)?|﷼|\u20c1)/gu, '').trim();
      return `<span class="core-recommendation-money" dir="ltr"><i class="sicon-sar" role="img" aria-label="SAR"></i><span>${amount}</span></span>`;
    }
    return formatted;
  }

  getRecommendationBadge() {
    const value = this.product.discount_ends;
    if (!this.product.preorder?.label && this.product.is_on_sale && value) {
      const numeric = Number(value);
      const raw = String(value);
      const date = Number.isFinite(numeric) ? new Date(numeric < 1e12 ? numeric * 1000 : numeric) :
        new Date(/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(raw) ? `${raw.length === 10 ? `${raw}T23:59:59` : raw.replace(' ', 'T')}+03:00` : raw);
      if (Number.isFinite(date.getTime()) && date.getTime() > Date.now()) {
        // The platform countdown accepts a date/time in KSA, rather than ISO with a zone.
        const ksaDate = new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        return `<div class="core-recommendation-badge core-recommendation-badge--timer"><span>${this.escapeHTML(salla.lang.get('beauty.recommendation_ends_in'))}</span><salla-count-down date="${ksaDate}" end-of-day="false" boxed="false" labeled="false" digits="en" auto-segments="true" size="sm"></salla-count-down></div>`;
      }
    }
    const promotion = String(this.product.promotion_title || '').trim();
    const homepage = this.closest?.('.beauty-product-section');
    const badge = homepage && !this.product.preorder?.label ?
      (document.body?.dataset?.beautyShowProductPromotionTitles === 'true' && promotion ? `<div class="s-product-card-promotion-title">${this.escapeHTML(promotion)}</div>` : '') : this.getProductBadge();
    return /^(الأكثر مبيع[ًاً]*|best seller)$/iu.test(String(this.product.promotion_title || '').trim()) && !this.product.preorder?.label ?
      badge.replace('s-product-card-promotion-title', 's-product-card-promotion-title core-recommendation-badge--bestseller') : /^(الأكثر شهرة|most popular)$/iu.test(promotion) ? badge.replace('s-product-card-promotion-title', 's-product-card-promotion-title core-recommendation-badge--popular') : badge;
  }

  renderRecommendation({ productId, productUrl, productName, productType, cartLabel, wishlistLabel, rating, status }) {
    const brand = this.product.brand?.name;
    const count = Number(this.product.rating?.count);
    const regular = Number(this.product.regular_price);
    const sale = Number(this.product.sale_price);
    const onSale = this.product.is_on_sale && Number.isFinite(regular) && Number.isFinite(sale) && regular > 0 && sale >= 0 && sale < regular;
    const discount = onSale ? Math.floor((regular - sale) / regular * 100) : 0;
    const icon = this.product.type === 'booking' ? '<i class="sicon-calendar-time" aria-hidden="true"></i>' :
      `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${this.product.has_options ?
        '<rect x="13" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="14" height="14" rx="2"/><rect x="5" y="13" width="14" height="14" rx="2"/><path d="M6 2v8M2 6h8"/>' :
        '<path d="M7 12h16l2 15H5l2-15Z"/><path d="M10 12V9a5 5 0 0 1 10 0v3"/><circle class="core-recommendation-icon-clear" cx="24" cy="25" r="6" stroke="none"/><path d="M24 20v10M19 25h10"/>'}</svg>`;
    const available = this.effectiveStatus === 'sale';
    const media = this.product.image?.url || this.product.thumbnail;
    const hasMedia = media && !salla.url.is_placeholder(media);
    return `
      <div class="core-recommendation-image${hasMedia ? '' : ' core-recommendation-image--empty'}">
        ${hasMedia ? `<a href="${productUrl}" aria-label="${productName}"><img src="${this.safeUrl(this.product.image?.url || this.product.thumbnail || this.placeholder || '')}" alt="${this.escapeHTML(this.product.image?.alt || this.product.name)}" loading="lazy" width="240" height="240" /></a>` : ''}
        ${this.getRecommendationBadge()}
        <salla-button shape="icon" fill="outline" color="light" aria-label="${wishlistLabel}" class="s-product-card-wishlist-btn animated ${this.isInWishlist ? 's-product-card-wishlist-added' : 'not-added'}" data-id="${productId}"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 28S3 20 3 10.5C3 3 12 2 16 9c4-7 13-6 13 1.5C29 20 16 28 16 28Z"/></svg></salla-button>
        ${!this.hideAddBtn ? `<salla-add-product-button class="core-recommendation-cart${rating > 0 ? '' : ' core-recommendation-cart--no-rating'}${available ? '' : ' core-recommendation-cart--status'}" fill="outline" width="normal" product-id="${productId}" product-status="${status}" product-type="${productType}" aria-label="${this.escapeHTML(cartLabel)}: ${productName}">${available ? icon : ''}<span class="${available ? 'sr-only' : ''}">${this.escapeHTML(cartLabel)}</span></salla-add-product-button>` : ''}
      </div>
      <div class="core-recommendation-content">
        ${rating > 0 ? `<div class="core-recommendation-tools">
          ${rating > 0 ? `<div class="core-recommendation-rating" role="img" aria-label="${rating} / 5${Number.isSafeInteger(count) && count > 0 ? ` (${count})` : ''}"><span class="core-recommendation-score" dir="ltr"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 1 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L1 7.6l6.2-.9Z"/></svg><bdi>${rating.toFixed(1)}</bdi></span>${Number.isSafeInteger(count) && count > 0 ? `<bdi class="core-recommendation-count">(${count})</bdi>` : ''}</div>` : ''}
        </div>` : ''}
        ${brand ? `<p class="core-recommendation-brand"><bdi>${this.escapeHTML(brand)}</bdi></p>` : ''}
        <h3 class="core-recommendation-name"><a href="${productUrl}" title="${productName}">${productName}</a></h3>
        <div class="core-recommendation-prices">
          ${onSale ? `<del>${this.getRecommendationMoney(regular)}</del>` : ''}
          <div class="core-recommendation-price-row"><bdi class="core-recommendation-price${onSale ? ' core-recommendation-price--sale' : ''}">${!onSale && this.product.starting_price ? `<span class="core-recommendation-starting">${this.escapeHTML(this.startingPrice)}</span> ` : ''}${this.getRecommendationMoney(onSale ? sale : (this.product.starting_price || this.product.price))}</bdi>${discount > 0 ? `<bdi class="core-recommendation-discount">-${discount}%</bdi>` : ''}</div>
        </div>
      </div>`;
  }

  render(){
    const productId = this.escapeHTML(this.product.id);
    const productUrl = this.safeUrl(this.product.url);
    const productName = this.escapeHTML(this.product.name);
    const productType = this.escapeHTML(this.product.type);
    const suppliedCartLabel = this.product.add_to_cart_label;
    const useSectionCartLabel = this.closest?.('.beauty-product-section') &&
      (!suppliedCartLabel || suppliedCartLabel === salla.lang.get('pages.cart.add_to_cart'));
    const cartLabel = useSectionCartLabel ? this.getAddButtonLabel() : (suppliedCartLabel || this.getAddButtonLabel());
    const productSection = this.closest?.('.beauty-product-section');
    const showSectionActions = productSection && !this.horizontal && !this.fullImage && !this.minimal;
    const rawRating = Number(this.product?.rating?.stars);
    const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(0, rawRating)) : 0;
    const ratingLabel = rating > 0 ? `${rating} / 5` : salla.lang.get('beauty.no_product_reviews');
    const viewProductLabel = this.escapeHTML(productSection?.dataset.viewProductLabel || salla.lang.get('beauty.view_product'));
    const wishlistLabel = this.escapeHTML(document.body.dataset.beautyWishlistLabel || salla.lang.get('beauty.wishlist_toggle'));
    this.classList.add('s-product-card-entry'); 
    this.setAttribute('id', this.product.id);
    !this.horizontal && !this.fullImage && !this.minimal? this.classList.add('s-product-card-vertical') : '';
    this.horizontal && !this.fullImage && !this.minimal? this.classList.add('s-product-card-horizontal') : '';
    this.fitImageHeight && !this.isSpecial && !this.fullImage && !this.minimal? this.classList.add('s-product-card-fit-height') : '';
    this.isSpecial? this.classList.add('s-product-card-special') : '';
    this.fullImage? this.classList.add('s-product-card-full-image') : '';
    this.minimal? this.classList.add('s-product-card-minimal') : '';
    this.product?.donation?  this.classList.add('s-product-card-donation') : '';
    this.shadowOnHover?  this.classList.add('s-product-card-shadow') : '';
    this.product?.is_out_of_stock?  this.classList.add('s-product-card-out-of-stock') : '';
    this.isInWishlist = !salla.config.isGuest() && salla.storage.get('salla::wishlist', []).includes(Number(this.product.id));
    this.effectiveStatus = (this.product.is_out_of_stock && window.notify_when_available_in_card && !['donating', 'financial_support'].includes(this.product?.type))
      ? 'out-and-notify'
      : this.product.status;
    const status = this.escapeHTML(this.effectiveStatus);
    const recommendation = (this.closest?.('.core-product-related') || showSectionActions) && !this.product.donation && !this.isSpecial;
    if (recommendation) this.classList.add('core-recommendation-card');
      this.innerHTML = recommendation ? this.renderRecommendation({ productId, productUrl, productName, productType, cartLabel, wishlistLabel, rating, status }) : `
        <div class="${!this.fullImage ? 's-product-card-image' : 's-product-card-image-full'}">
          <a href="${productUrl}" aria-label="${this.escapeHTML(this.product?.image?.alt || this.product.name)}">
           <img 
              class="s-product-card-image-${salla.url.is_placeholder(this.product?.image?.url)
                ? 'contain'
                : this.fitImageHeight
                ? this.fitImageHeight
                : 'cover'}"
              src="${this.safeUrl(this.product?.image?.url || this.product?.thumbnail || this.placeholder || '')}"
              alt="${this.escapeHTML(this.product?.image?.alt || this.product.name)}"
              loading="lazy"
            />
            ${!this.fullImage && !this.minimal ? this.getProductBadge() : ''}
          </a>
          ${this.fullImage ? `<a href="${productUrl}" aria-label="${productName}" class="s-product-card-overlay"></a>`:''}
          ${showSectionActions ? '<div class="beauty-product-card-actions">' : ''}
          ${!this.horizontal && !this.fullImage ?
            `<salla-button
              shape="icon"
              fill="outline"
              color="light"
              name="product-name-${productId}"
              aria-label="${wishlistLabel}"
              class="s-product-card-wishlist-btn animated ${this.isInWishlist ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'}"
              data-id="${productId}">
              <i class="sicon-heart"></i>
            </salla-button>` : ``
          }
          ${showSectionActions ? `<a class="beauty-product-card-view" href="${productUrl}" aria-label="${viewProductLabel}: ${productName}"><i class="sicon-eye" aria-hidden="true"></i></a></div>` : ''}
        </div>
        <div class="s-product-card-content">
          ${this.isSpecial && this.product?.quantity ?
            `<div class="s-product-card-content-pie">
              <span>
                <b>${this.escapeHTML(salla.helpers.number(this.product?.quantity))}</b>
                ${this.escapeHTML(this.remained)}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -1 36 34" class="s-product-card-content-pie-svg">
                <circle cx="16" cy="16" r="15.9155" class="s-product-card-content-pie-svg-base" />
                <circle cx="16" cy="16" r="15.9155" class="s-product-card-content-pie-svg-bar" />
              </svg>
            </div>`
            : ``}

          <div class="s-product-card-content-main ${this.isSpecial ? 's-product-card-content-extra-padding' : ''}">
            <h3 class="s-product-card-content-title">
              <a href="${productUrl}">${productName}</a>
            </h3>

            ${this.product?.subtitle && !this.minimal ?
              `<p class="s-product-card-content-subtitle opacity-80">${this.escapeHTML(this.product?.subtitle)}</p>`
              : ``}
          </div>
          ${this.product?.donation && !this.minimal && !this.fullImage ?
          `<salla-progress-bar donation="${this.escapeHTML(JSON.stringify(this.product?.donation))}"></salla-progress-bar>
          <div class="s-product-card-donation-input">
            ${this.product?.donation?.can_donate && this.product?.donation?.custom_amount_enabled  ?
              `<label for="donation-amount-${productId}">${this.escapeHTML(this.donationAmount)} <span>*</span></label>
              <input
                type="text"
                id="donation-amount-${productId}"
                name="donating_amount"
                class="s-form-control"
                placeholder="${this.escapeHTML(this.donationAmount)}" />`
              : ``}
          </div>`
            : ''}
          <div class="s-product-card-content-sub ${this.isSpecial ? 's-product-card-content-extra-padding' : ''}">
            ${this.product?.donation?.can_donate ? '' : this.getProductPrice()}
            ${rating > 0 || showSectionActions ?
              `<div class="s-product-card-rating" role="img" aria-label="${this.escapeHTML(ratingLabel)}" title="${this.escapeHTML(ratingLabel)}">
                <span class="beauty-rating-stars${rating > 0 ? '' : ' beauty-rating-stars--empty'}" aria-hidden="true" style="--rating-fill: ${rating * 20}%">${rating > 0 ? '★★★★★' : '☆☆☆☆☆'}</span>
                <i class="sicon-star2 before:text-orange-300" aria-hidden="true"></i>
                <span aria-hidden="true">${rating}</span>
              </div>`
               : ``}
          </div>

          ${this.isSpecial && this.product.discount_ends
            ? `<salla-count-down date="${this.formatDate(this.product.discount_ends)}" end-of-day=${true} boxed=${true}
              labeled=${true} />`
            : ``}


          ${!this.hideAddBtn ?
            `<div class="s-product-card-content-footer gap-2">
              <salla-add-product-button fill="outline" width="wide"
                product-id="${productId}"
                product-status="${status}"
                product-type="${productType}">
                ${this.product.status == 'sale' ?
                    `<i class="text-base sicon-${ this.product.type == 'booking' ? 'calendar-time' : 'shopping-bag'}"></i>` : ``
                  }
                <span>${this.escapeHTML(cartLabel)}</span>
              </salla-add-product-button>

              ${this.horizontal || this.fullImage ?
                `<salla-button 
                  shape="icon" 
                  fill="outline" 
                  color="light" 
                  id="card-wishlist-btn-${productId}-horizontal"
                  aria-label="${wishlistLabel}"
                  class="s-product-card-wishlist-btn animated ${this.isInWishlist ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'}"
                  data-id="${productId}">
                  <i class="sicon-heart"></i> 
                </salla-button>`
                : ``}
            </div>`
            : ``}
        </div>
      `

      this.querySelectorAll('[name="donating_amount"]').forEach((element)=>{
        element.addEventListener('input', (e) => {
          e.target
            .closest(".s-product-card-content")
            .querySelector("salla-add-product-button")
            .setAttribute("donating-amount", e.target.value); 
        });
      })

      if (this.product?.quantity && this.isSpecial) {
        this.initCircleBar();
      }

      // Optimistic & Per-card wishlist toggle
      this.querySelectorAll('salla-button.s-product-card-wishlist-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          salla.wishlist.toggle(this.product.id);
          const willBeAdded = !btn.classList.contains('s-product-card-wishlist-added');
          app.toggleElementClassIf(btn, 's-product-card-wishlist-added', 'not-added', () => willBeAdded);
          app.toggleElementClassIf(btn, 'pulse-anime', 'un-favorited', () => willBeAdded);
        });
      });
    }
}

customElements.define('custom-salla-product-card', ProductCard);
