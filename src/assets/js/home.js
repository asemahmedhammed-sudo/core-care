import "lite-youtube-embed";
import "./beauty-routine";
import BasePage from "./base-page";
import Lightbox from "fslightbox";
import initPromotionCarousels from './partials/promotion-carousel';
import initCategoryMedia from './partials/category-media';
window.fslightbox = Lightbox;
// The banner does not depend on the store SDK being ready.
initPromotionCarousels();
initCategoryMedia();

class Home extends BasePage {
    onReady() {
        this.initFeaturedTabs();
        document.querySelectorAll('.beauty-product-section salla-products-slider').forEach(slider => {
            slider.sliderConfig = {
                slidesPerView: 2.1, spaceBetween: 16,
                breakpoints: { 640: { slidesPerView: 3.1 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 5.5 }, 1280: { slidesPerView: 7 } }
            };
        });
    }

    /**
     * used in views/components/home/featured-products-style*.twig
     */
    initFeaturedTabs() {
        app.all('.tab-trigger', el => {
            el.addEventListener('click', ({ currentTarget: btn }) => {
                let id = btn.dataset.componentId;
                // btn.setAttribute('fill', 'solid');
                app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'is-active opacity-0 translate-y-3', 'inactive', tab => tab.id == btn.dataset.target)
                    .toggleClassIf(`#${id} .tab-trigger`, 'is-active', 'inactive', tabBtn => tabBtn == btn);

                // fadeIn active tabe
                setTimeout(() => app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'opacity-100 translate-y-0', 'opacity-0 translate-y-3', tab => tab.id == btn.dataset.target), 100);
            })
        });
        document.querySelectorAll('.s-block-tabs').forEach(block => block.classList.add('tabs-initialized'));
    }
}

Home.initiateWhenReady(['index']);
