import 'lite-youtube-embed';
import BasePage from './base-page';
import Fslightbox from 'fslightbox';
window.fslightbox = Fslightbox;
import { zoom } from './partials/image-zoom';
import { registerProductGallery } from './partials/product-gallery';

class Product extends BasePage {
    onReady() {
        app.watchElements({
            totalPrice: '.total-price',
            productWeight: '.product-weight',
            beforePrice: '.before-price',
            startingPriceTitle: '.starting-price-title',
            productSku: '.product-sku',
        });

        this.initProductOptionValidations();
        registerProductGallery();
        this.initNativeGallery();
        this.initInstallmentSummary();

        if (imageZoom && imageZoom !== 'false' && document.querySelector('[data-product-gallery]')) {
            // call the function when the page is ready
            this.initImagesZooming();
            document.querySelector('[data-product-gallery]').addEventListener('gallery-change', () => this.initImagesZooming());
            // listen to screen resizing
            window.addEventListener('resize', () => this.initImagesZooming());
        }
    }

    initProductOptionValidations() {
      document.querySelector('.product-form')?.addEventListener('change', function(){
        // reportValidity() natively focuses/scrolls to the first empty required option mid-edit; read validity instead
        const isComplete = Array.from(this.elements).every(el => !el.willValidate || el.validity.valid);
        isComplete && salla.product.getPrice(new FormData(this));
      });
    }

    initNativeGallery() {
        const slider = document.querySelector('[data-product-gallery]');
        const images = JSON.parse(slider?.dataset.images || '[]');
        if (!images.length) return;
        // capture phase: fslightbox binds via anchor.onclick, stopPropagation keeps it from firing
        slider.querySelector('.core-product-media__stage').addEventListener('click', (event) => {
            const link = event.target.closest('a[data-fslightbox]');
            if (!link) return;
            if (!salla.mobile?.openGallery?.(images, images[+link.dataset.slidIndex])) return;
            event.preventDefault();
            event.stopPropagation();
        }, { capture: true });
    }

    initInstallmentSummary() {
        const details = document.querySelector('.core-product-installments');
        const widget = details?.querySelector('salla-installment');
        const logos = details?.querySelector('.core-product-installment-logos');
        if (!widget || !logos) return;

        // The summary follows enabled Salla providers; expanded content remains
        // the native widget, including its terms and live option-price updates.
        const sync = () => {
            details.hidden = !widget.children.length;
            const providers = [
                ['tabby', '#tabbyPromoWrapper', 'tabby_installment'],
                ['Tamara', 'tamara-widget, .tamara-product-widget', 'tamara_installment'],
            ];
            logos.replaceChildren(...providers.filter(([, selector]) => widget.querySelector(selector)).map(([name, , logo]) => {
                const image = document.createElement('img');
                const path = `images/payment/${logo}_mini.png`;
                image.src = logo === 'tabby_installment' ? salla.url.assetsCdn(path) : salla.url.cdn(path);
                image.alt = name;
                image.width = 48;
                image.height = 20;
                return image;
            }));
        };
        new MutationObserver(sync).observe(widget, { childList: true, subtree: true });
        sync();
    }

    initImagesZooming() {
        if (window.innerWidth < 1024) return;
        const image = document.querySelector('[data-gallery-slide]:not([hidden]):not(.video-entry) > img');
        if (!image || image.parentElement.querySelector('.img-magnifier-glass')) return;
        const magnify = () => {
            if (window.innerWidth >= 1024 && !image.parentElement.hidden && !image.parentElement.querySelector('.img-magnifier-glass')) zoom(image.id, 2);
        };
        if (image.complete && image.naturalWidth) magnify();
        else image.addEventListener('load', magnify, { once: true });
    }

    registerEvents() {
      salla.event.on('product::price.updated.failed',()=>{
        app.element('.price-wrapper').classList.add('hidden');
        const outOfStock = app.element('.out-of-stock');
        outOfStock.classList.remove('hidden');
        outOfStock.classList.remove('scale-pulse');
        void outOfStock.offsetWidth; // trigger reflow
        outOfStock.classList.add('scale-pulse');
      })
      salla.product.event.onPriceUpdated((res) => {

        app.element('.out-of-stock').classList.add('hidden')
        app.element('.price-wrapper').classList.remove('hidden')

        let data = res.data,
            is_on_sale = data.has_sale_price && data.regular_price > data.price;

        app.startingPriceTitle?.classList.add('hidden');

        app.productWeight.forEach((el) => {el.innerHTML = data.weight || ''});
        app.totalPrice.forEach((el) => {el.innerHTML = salla.money(data.price)});
        app.beforePrice.forEach((el) => {el.innerHTML = salla.money(data.regular_price)});
        const discount = document.querySelector('.core-product-discount');
        if (discount) {
          discount.classList.toggle('hidden', !is_on_sale);
          discount.textContent = is_on_sale ? `-${Math.round((1 - data.price / data.regular_price) * 100)}%` : '';
        }
        document.querySelector('salla-installment')?.setAttribute('price', data.price);
        app.productSku.forEach((el) => {el.innerHTML = data.sku || ''});

        app.toggleClassIf('.price_is_on_sale','showed','hidden', ()=> is_on_sale)
        app.toggleClassIf('.starting-or-normal-price','hidden','showed', ()=> is_on_sale)

        document.querySelectorAll('.total-price, .product-weight').forEach(el => {
          el.classList.remove('scale-pulse');
          void el.offsetWidth; // trigger reflow
          el.classList.add('scale-pulse');
        });
      });

      app.onClick('#btn-show-more', e => app.all('#more-content', div => {
        e.target.classList.add('is-expanded');
        div.style = `max-height:${div.scrollHeight}px`;
      }) || e.target.remove());
    }
}

Product.initiateWhenReady(['product.single']);
