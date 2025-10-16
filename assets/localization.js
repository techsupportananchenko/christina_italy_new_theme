/**
 *  @class
 *  @function LocalizationForm
 */
if (!customElements.get('localization-form')) {
  class LocalizationForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.inputs = this.form.querySelectorAll('select[name="locale_code"], select[name="country_code"]');
      this.debouncedOnSubmit = debounce((event) => {
        this.onSubmitHandler(event);
      }, 200);
      this.inputs.forEach(item => item.addEventListener('change', this.debouncedOnSubmit.bind(this)));
    }
    onSubmitHandler(event) {
      if (this.form) this.form.submit();
    }
  }
  customElements.define('localization-form', LocalizationForm);
}