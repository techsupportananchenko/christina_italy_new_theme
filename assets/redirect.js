(function(document, window, undefined) {
  window.IPRedirect = {
    init: function(settings) {
      // Assignment
      var self = this;

      self.settings = settings;
      self.redirect = localStorage.getItem("location-redirect");
      self.messageWrap = document.querySelectorAll("#location-redirect-message, #location-redirect-popup");
      self.currentCountry = self.messageWrap.length ? document.querySelector('.current-country', self.messageWrap[0]) : null;
      self.RedirectMe = self.messageWrap.length ? document.querySelector('.redirect-me', self.messageWrap[0]) : null;
      self.closeBtn = self.messageWrap.length ? document.querySelector('.close-redirect-btn', self.messageWrap[0]) : null;
      self.newStore = self.messageWrap.length ? document.querySelector('.new-store', self.messageWrap[0]) : null;

      self.catchAllCountries = settings["redirect_catch_all_countries"];
      self.catchAllURL = settings["redirect_catch_all_url"];
      self.catchAllName = settings["redirect_catch_all_name"];

      self.forceRedirect = settings["redirect_force"] ? true : false;
      self.relativeRedirect = settings["redirect_relative"] ? true : false;
      self.countryTranslations = {
        "Sweden": "Sverige"
      };
      self.domain = "https://reallyfreegeoip.org/json/?callback=?";
      self.redirects = [];
      self.urlMap = {};
      self.location = {};

      // Preparation
      self.loadRedirects(settings);
      self.mapURLs(self.redirects, "::");
      self.redirect = (typeof self.redirect == "string") ? JSON.parse(self.redirect) : {shown: false, date: null};
      self.redirect.shown = self.getIsRedirectShown();

      // Initialization successful
      return true;
    },
    run: function() {
      var self = this;

      var successCallback = (self.forceRedirect) ? self.fetchAndRedirectOnResponse.bind(self) : self.fetchAndShowRedirect.bind(self),
        activateRedirect = (!self.redirect.shown || self.forceRedirect) ? true : false;

      if (activateRedirect) {
        self.makeServerCall(self.fetchLocationInfoAndRunCallback.bind(self), successCallback);

        if (!self.forceRedirect)
          self.bindRedirect();
      }
    },
    loadRedirects: function(settings) {
      var self = this;
      for (var i = 1; i < 11; ++i) {
        var name = "redirect_" + i;
        self.redirects.push(settings[name]);
      }
    },
    mapURLs: function(stringList, splitter) {
      var self = this;

      for (var i = 0; i < stringList.length; ++i) {
        if (stringList[i] && stringList[i] !== "") {
          var splitString = stringList[i].split(splitter);

          if (splitString[2].indexOf("http://") === -1 && splitString[2].indexOf("https://") === -1) {
            splitString[2] = "http://" + splitString[2];
          }

          self.urlMap[splitString[0]] = {
            "name": splitString[1],
            "url": splitString[2]
          };
        }
      }

      if (self.catchAllCountries && self.catchAllCountries.length > 0) {
        var countries = self.catchAllCountries.split(/[\s,]+/);

        for (var i = 0; i < countries.length; ++i) {
          self.urlMap[countries[i]] = {
            "name": self.catchAllName,
            "url": self.catchAllURL
          };
        }
      }

      return self.urlMap;
    },
    getIsRedirectShown: function() {
      var self = this,
        today = new Date(),
        prevDate = new Date(self.redirect.date),
        dayLength = 1000 * 24 * 60 * 60, // in milliseconds
        diffDate = today - prevDate;

      // display query again if localStorage is older than 30 days
      if (diffDate / dayLength > 30)
        return false;

      return true;
    },
    makeServerCall: function(serverCall, callback) {
      return serverCall(callback);
    },
    fetchLocationInfoAndRunCallback: function(successCallback) {
      var self = IPRedirect;

      var callbackName = 'jsonp_' + Math.round(100000 * Math.random());
      window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        successCallback(data);
      };

      var script = document.createElement('script');
      script.src = self.domain.replace('callback=?', 'callback=' + callbackName);
      script.async = false;
      document.body.appendChild(script);
    },
    fetchAndShowRedirect: function(location) {
      var self = IPRedirect;

      self.location = location;

      if (self.urlMap[location.country_code] && self.urlMap[location.country_code].url) {
        var countryName = (self.countryTranslations[location.country_name]) ? self.countryTranslations[location.country_name] : location.country_name;

        if (self.currentCountry) self.currentCountry.textContent = countryName;
        if (self.newStore) self.newStore.textContent = self.urlMap[location.country_code].name;
        if (self.RedirectMe) {
          if (self.relativeRedirect) {
            self.RedirectMe.setAttribute("href", self.urlMap[location.country_code].url + window.top.location.pathname);
          } else {
            self.RedirectMe.setAttribute("href", self.urlMap[location.country_code].url);
          }
        }
        if (self.settings.redirect_popup) {
          self.showModal(document.getElementById('location-redirect-popup'), {
            afterClose: function() {
              self.saveRedirect();
            }
          });
        } else if (self.messageWrap.length) {
          self.messageWrap.forEach(function(el) {
            el.style.display = 'block';
          });
        }
      }
    },
    fetchAndRedirectOnResponse: function(location) {
      var self = IPRedirect;

      self.location = location;

      if (self.urlMap[location.country_code] && self.urlMap[location.country_code].url) {
        if (self.relativeRedirect) {
          window.top.location.assign(self.urlMap[location.country_code].url + window.top.location.pathname);
        } else {
          window.top.location.assign(self.urlMap[location.country_code].url);
        }
      }
    },
    bindRedirect: function() {
      var self = this;

      // only save to local storage if the user doesn't want to be redirected.
      if (self.closeBtn) {
        self.closeBtn.removeEventListener('click', self.closeBtn._clickHandler);
        self.closeBtn._clickHandler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          self.messageWrap.forEach(function(el) {
            el.style.display = 'none';
          });
          self.closeModal();
          self.saveRedirect();
        };
        self.closeBtn.addEventListener('click', self.closeBtn._clickHandler);
      }

      if (self.RedirectMe) {
        self.RedirectMe.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }
    },
    saveRedirect: function() {
      var redirect = {
        shown: true,
        date: Date()
      };
      localStorage.setItem("location-redirect", JSON.stringify(redirect));
    },
    showModal: function(content, config) {
      var self = this;

      // Create modal structure
      var modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 1000; opacity: 0;
        transition: opacity 250ms ease-in-out;
      `;

      var modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      var closeButton = document.createElement('span');
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        position: absolute; top: 10px; right: 10px; cursor: pointer;
        font-size: 20px; color: #333;
      `;

      modalContent.appendChild(closeButton);
      modalContent.appendChild(content);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Show modal with animation
      requestAnimationFrame(function() {
        modal.style.opacity = '1';
      });

      // Event listeners
      var closeModalHandler = function(e) {
        if (e.target === modal || e.target === closeButton) {
          e.preventDefault();
          self.closeModal(modal, config.afterClose);
        }
      };

      modal.addEventListener('click', closeModalHandler);
      closeButton.addEventListener('click', closeModalHandler);

      var escHandler = function(e) {
        if (e.keyCode === 27) {
          self.closeModal(modal, config.afterClose);
          document.removeEventListener('keyup', escHandler);
        }
      };
      document.addEventListener('keyup', escHandler);

      self.currentModal = { element: modal, escHandler: escHandler };
    },
    closeModal: function(modal, afterClose) {
      var self = this;
      if (!modal && self.currentModal) {
        modal = self.currentModal.element;
      }
      if (modal) {
        modal.style.opacity =0;
        setTimeout(function() {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
          if (self.currentModal && self.currentModal.escHandler) {
            document.removeEventListener('keyup', self.currentModal.escHandler);
          }
          self.currentModal = null;
          if (afterClose) afterClose();
        }, 250);
      }
    }
  };
})(document, window);