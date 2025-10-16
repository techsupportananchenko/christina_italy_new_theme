if (!customElements.get('product-slider-thumbnails')) {
  /**
   *  @class
   *  @function ProductSliderThumbnails
   */
  class ProductSliderThumbnails extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('change', this.setupProductGallery);
    }
    connectedCallback() {
      this.product_container = this.closest('.thb-product-detail');
      this.thumbnail_container = this.product_container.querySelector('.product-thumbnail-container');
      this.video_containers = this.querySelectorAll('.product-single__media-external-video--play');

      this.setOptions();
      // Start Slider
      this.init();
    }
    setOptions() {
      this.hide_variants = this.dataset.hideVariants == 'true';
      this.thumbnails = this.thumbnail_container.querySelectorAll('.product-thumbnail');
      this.prev_button = this.querySelector('.flickity-prev');
      this.next_button = this.querySelector('.flickity-next');
      this.options = {
        wrapAround: true,
        pageDots: false,
        contain: true,
        adaptiveHeight: true,
        initialIndex: '.is-initial-selected',
        prevNextButtons: false,
        fade: false,
        cellSelector: '.product-images__slide.is-active'
      };
    }
    init() {
      this.flkty = new Flickity(this, this.options);

      this.selectedIndex = this.flkty.selectedIndex;

      // Setup Events
      this.setupEvents();

      // Start Gallery
      this.setupProductGallery();
    }
    reInit(imageSetIndex) {

      this.flkty.destroy();

      this.setOptions();

      this.flkty = new Flickity(this, this.options);

      // Setup Events
      this.setupEvents();

      this.selectedIndex = this.flkty.selectedIndex;
    }
    setupEvents() {
      const _this = this;
      if (this.prev_button) {
        let prev = this.prev_button.cloneNode(true);
        this.prev_button.parentNode.append(prev);
        this.prev_button.remove();
        prev.addEventListener('click', (event) => {
          this.flkty.previous();
        });
        prev.addEventListener('keyup', (event) => {
          this.flkty.previous();
          event.preventDefault();
        });
      }
      if (this.next_button) {
        let next = this.next_button.cloneNode(true);
        this.next_button.parentNode.append(next);
        this.next_button.remove();
        next.addEventListener('click', (event) => {
          this.flkty.next();
        });
        next.addEventListener('keyup', (event) => {
          this.flkty.next();
          event.preventDefault();
        });
      }
      this.video_containers.forEach((container) => {
        container.querySelector('button').addEventListener('click', function () {
          container.setAttribute('hidden', '');
        });
      });
      this.flkty.on('settle', function (index) {
        _this.selectedIndex = index;
      });
      this.flkty.on('change', (index) => {

        let previous_slide = this.flkty.cells[_this.selectedIndex].element,
          previous_media = previous_slide.querySelector('.product-single__media'),
          active_thumbs = Array.from(this.thumbnails).filter(element => element.classList.contains('is-active')),
          active_thumb = active_thumbs[index] ? active_thumbs[index] : active_thumbs[0];

        this.thumbnails.forEach((item, i) => {
          item.classList.remove('is-initial-selected');
        });
        active_thumb.classList.add('is-initial-selected');

        requestAnimationFrame(() => {
          if (active_thumb.offsetParent === null) {
            return;
          }
          const windowHalfHeight = active_thumb.offsetParent.clientHeight / 2,
            windowHalfWidth = active_thumb.offsetParent.clientWidth / 2;
          active_thumb.parentElement.scrollTo({
            left: active_thumb.offsetLeft - windowHalfWidth + active_thumb.clientWidth / 2,
            top: active_thumb.offsetTop - windowHalfHeight + active_thumb.clientHeight / 2,
            behavior: 'smooth'
          });
        });

        // Stop previous video
        if (previous_media.classList.contains('product-single__media-external-video')) {
          if (previous_media.dataset.provider === 'youtube') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              event: "command",
              func: "pauseVideo",
              args: ""
            }), "*");
          } else if (previous_media.dataset.provider === 'vimeo') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              method: "pause"
            }), "*");
          }
          previous_media.querySelector('.product-single__media-external-video--play').removeAttribute('hidden');
        } else if (previous_media.classList.contains('product-single__media-native-video')) {
          previous_media.querySelector('video').pause();
        }

      });


      setTimeout(() => {
        let active_thumbs = Array.from(this.thumbnails).filter(element => element.clientWidth > 0);
        active_thumbs.forEach((thumbnail, index) => {
          thumbnail.addEventListener('click', () => {
            this.thumbnailClick(thumbnail, index);
          });
        });
      });

    }
    thumbnailClick(thumbnail, index) {
      [].forEach.call(this.thumbnails, function (el) {
        el.classList.remove('is-initial-selected');
      });
      thumbnail.classList.add('is-initial-selected');
      this.flkty.select(index);
    }
    setDraggable(draggable) {
      this.flkty.options.draggable = draggable;
      this.flkty.updateDraggable();
    }
    selectCell(mediaId) {
      this.flkty.selectCell(mediaId);
    }
    setupProductGallery() {
      if (!this.querySelectorAll('.product-single__media-zoom').length) {
        return;
      }
      this.setEventListeners();
    }
    buildItems() {
      this.activeImages = Array.from(this.querySelectorAll('.product-images__slide.is-active .product-single__media-image'));

      return this.activeImages.map((item) => {
        let index = [].indexOf.call(item.parentNode.parentNode.children, item.parentNode);

        let activelink = item.querySelector('.product-single__media-zoom');

        activelink.dataset.index = index;
        return {
          src: activelink.getAttribute('href'),
          msrc: activelink.dataset.msrc,
          w: activelink.dataset.w,
          h: activelink.dataset.h
        };
      });
    }
    setEventListeners() {
      this.links = this.querySelectorAll('.product-single__media-zoom');
      this.pswpElement = document.querySelectorAll('.pswp')[0];
      this.pswpOptions = {
        maxSpreadZoom: 2,
        loop: false,
        allowPanToNext: false,
        closeOnScroll: false,
        showHideOpacity: false,
        arrowKeys: true,
        history: false,
        captionEl: false,
        fullscreenEl: false,
        zoomEl: false,
        shareEl: false,
        counterEl: true,
        arrowEl: true,
        preloaderEl: true,
        getThumbBoundsFn: () => {
          const thumbnail = this.querySelector('.product-images__slide.is-selected'),
            pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
            rect = thumbnail.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + pageYScroll,
            w: rect.width
          };
        }
      };


      this.links.forEach((link => {
        link.addEventListener('click', (e) => this.zoomClick(e, link));
      }));
    }
    zoomClick(e, link) {
      this.items = this.buildItems();
      this.pswpOptions.index = parseInt(link.dataset.index, 10);
      if (typeof PhotoSwipe !== 'undefined') {
        let pswp = new PhotoSwipe(this.pswpElement, PhotoSwipeUI_Default, this.items, this.pswpOptions);
        pswp.listen('firstUpdate', function () {
          pswp.listen('parseVerticalMargin', function (item) {
            item.vGap = {
              top: 50,
              bottom: 50
            };
          });
        });
        pswp.init();
      }
      e.preventDefault();
    }
  }
  customElements.define('product-slider-thumbnails', ProductSliderThumbnails);
}