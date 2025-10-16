/**
 *  @class
 *  @function FreeShipping
 */

if (!customElements.get('free-shipping')) {
  class FreeShipping extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      let amountText = this.querySelector('.free-shipping--text span');
      let total = parseInt(this.dataset.cartTotal, 10);
      let minimum = Math.round(parseInt(this.dataset.minimum, 10) * (Shopify.currency.rate || 1));
      let percentage = 1;
      this.remainingText = this.querySelector('.free-shipping--text-remaining');
      this.fullText = this.querySelector('.free-shipping--text-full');

      if (total < minimum) {
        percentage = total / minimum;

        if (amountText) {
          let remaining = minimum - total;
          let format = window.theme.settings.money_with_currency_format || "${{amount}}";
          amountText.innerHTML = formatMoney(remaining, format);
        }

        if (this.remainingText && this.fullText) {
          this.remainingText.style.display = 'block';
          this.fullText.style.display = 'none';
        }
      } else {
        if (this.remainingText && this.fullText) {
          this.remainingText.style.display = 'none';
          this.fullText.style.display = 'block';
        }
      }

      this.style.setProperty('--percentage', percentage);
    }
  }

  customElements.define('free-shipping', FreeShipping);
}
