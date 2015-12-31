Polymer({
	is: 'parallax-frame',
	properties: {
		/*Animation duration in milliseconds.*/
		backToCenterDuration: {
			type: Number,
			value: 200,
			observer: '_backToCenterDurationChanged'
		},
		/*If `true`, content will not move to original position when mouse leaves `mouseListener`*/
		dissableBackToCenter: {
			type: Boolean,
			value: false,
			observer: '_dissableBackToCenterChanged'
		},
		/*Dissables parallax effect*/
		dissableParallax: {
			type: Boolean,
			value: false,
			observer: '_dissableParallaxChanged'
		},
		/*`true` if mouse is over `mouseListener`. Else `false.`*/
		mouseIn: {
			type: Boolean,
			value: false,
			readOnly: true,
			notify: true
		},
		/*Element for lintening mouse events used for parallax effect
		*
		*Note: Do not use `document`. Use `document.body` instead.*/
		mouseListener: {
			type: Object,
			value: function() {
				return this;
			},
			observer: '_mouseListenerChanged'
		},
		/*Part of content (in pixel) hidden from left and right when in original position*/
		offsetX: {
			type: Number,
			value: 64,
			observer: '_offsetXChanged'
		},
		/*Part of content (in pixel) hidden from top and bottom when in original position*/
		offsetY: {
			type: Number,
			value: 64,
			observer: '_offsetYChanged'
		}
	},
	/*`update` method should be called if size of `<parallax-frame>` changes while mouse if over `mouseListener`*/
	update: function() {
		if (this.mouseIn) {
			this._updateListenerPos();
			if (!this.dissableParallax) {
				this._move();
			}
		} else {
			this._mouseleave();
		}
	},
	created: function() {
		this._mouseenter = this._mouseenter.bind(this);
		this._mousemove = this._mousemove.bind(this);
		this._mouseleave = this._mouseleave.bind(this);
	},
	_backToCenterDurationChanged: function(newValue) {
		this.$.container.style.transitionDuration = this.backToCenterDuration + 'ms';
	},
	_dissableBackToCenterChanged: function(newValue) {
		if (newValue) {
			this.toggleClass('animating', false, this.$.container);
		} else if (!this.mouseIn) {
			this.toggleClass('animating', true, this.$.container);
		}
	},
	_dissableParallaxChanged: function() {
		this.update();
	},
	_mouseListenerChanged: function(newValue, oldValue) {
		newValue.addEventListener('mouseenter', this._mouseenter);
		newValue.addEventListener('mousemove', this._mousemove);
		newValue.addEventListener('mouseleave', this._mouseleave);
		this.update();
		if (oldValue) {
			oldValue.removeEventListener('mouseenter', this._mouseenter);
			oldValue.removeEventListener('mousemove', this._mousemove);
			oldValue.removeEventListener('mouseleave', this._mouseleave);
		}
	},
	_offsetXChanged: function(newValue) {
		var toSet = - newValue + 'px';
		this.$.container.style.left = toSet;
		this.$.container.style.right = toSet;
		this.update();
	},
	_offsetYChanged: function(newValue) {
		var toSet = - newValue + 'px';
		this.$.container.style.top = toSet;
		this.$.container.style.bottom = toSet;
		this.update();
	},
	_mouseenter: function() {
		this.mouseIn = true;
		this._updateListenerPos();
		this._asyncRemoveClass = this.async(function() {
			this.toggleClass('animating', false, this.$.container);
		}, this.backToCenterDuration + 100);
	},
	_mousemove: function(e) {
		this._mouseX = e.clientX;
		this._mouseY = e.clientY;
		if (!this.dissableParallax) {
			this._move();
		}
	},
	_mouseleave: function() {
		this.mouseIn = false;
		this.cancelAsync(this._asyncRemoveClass);
		if (this.dissableBackToCenter) {
			return;
		} else {
			cancelAnimationFrame(this._raf);
			this._chill = false;
			this.toggleClass('animating', true, this.$.container);
			if (!this.dissableParallax) {
				this.transform('none', this.$.container);
			}
		}
	},
	_updateListenerPos: function() {
		var rect = this.mouseListener.getBoundingClientRect();
		this._halfWidth = rect.width / 2;
		this._halfHeight = rect.height / 2;
		this._centerX = rect.left + this._halfWidth;
		this._centerY = rect.top + this._halfHeight;
	},
	_move: function() {
		if (this._chill) {
			return;
		}
		this._chill = true;
		this._raf = requestAnimationFrame(() => {
			this.transform('translate(' + (this._centerX - this._mouseX) / this._halfWidth * this.offsetX + 'px, ' + (this._centerY - this._mouseY) / this._halfHeight * this.offsetY + 'px)', this.$.container);
			this._chill = false;
		});
	}
});