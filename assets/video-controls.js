/**
 *  @class
 *  @function VideoControls
 */
if (!customElements.get('video-controls')) {
  class VideoControls extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.video = this.parentElement.querySelector('video');
      this.sound_toggle = this.querySelector('.video-controls--sound');
      this.play_toggle = this.querySelector('.video-controls--play-pause');

      this.setEventListeners();
    }
    setEventListeners() {
      this.play_toggle.addEventListener('click', this.playPause.bind(this));
      this.sound_toggle.addEventListener('click', this.muteUnmute.bind(this));
    }
    playPause(e) {
      if (this.video.paused) {
        this.video.play();
        this.play_toggle.classList.remove('paused');
      } else {
        this.video.pause();
        this.play_toggle.classList.add('paused');
      }
      e.stopPropagation();
    }
    muteUnmute(e) {
      if (this.video.muted) {
        this.video.muted = false;
        this.sound_toggle.classList.remove('muted');
      } else {
        this.video.muted = true;
        this.sound_toggle.classList.add('muted');
      }
      e.stopPropagation();
    }
  }
  customElements.define('video-controls', VideoControls);
}
