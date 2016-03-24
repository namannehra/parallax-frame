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
			value: false
		},
		/*Dissables parallax effect*/
		dissableParallax: {
			type: Boolean,
			value: false,
			observer: '_dissableParallaxChanged'
		},
		/*`true` if mouse is over `mouseListener`. Else `false.`
		*
		*__Note__: `mouseIn` is alawys set to `false` when `dissableParallax` is set `true` or `mouseListener` changes*/
		mouseIn: {
			type: Boolean,
			value: false,
			notify: true
		},
		/*Element for lintening mouse events used for parallax effect. __Note__: Do not use `document`. Use `document.body` instead.
		@type {HTMLElement}
		@default this*/
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
			this._calcPos();
			this._move();
		}
	},
	created: function() {
		this._mousemove = this._mousemove.bind(this);
		this._mouseleave = this._mouseleave.bind(this);
	},
	attached: function() {
		this._updateListeners();
	},
	detached: function() {
		this._updateListeners();
	},
	_backToCenterDurationChanged: function(newValue) {
		this.$.container.style.transitionDuration = this.backToCenterDuration + 'ms';
	},
	_dissableParallaxChanged: function(newValue) {
		if (newValue && this.mouseIn) {
			this._mouseleave();
		}
		this._updateListeners();
	},
	_mouseListenerChanged: function(newValue, oldValue) {
		if (!newValue || newValue.nodeType !== 1) {
			console.warn('<' + this.is + '>.mouseListener must be a node');
			this.mouseListener = oldValue;
			return;
		}
		if (this.mouseIn) {
			this._mouseleave();
		}
		if (oldValue && oldValue.nodeType === 1) {
			this._removeListeners(oldValue);
		}
		this._updateListeners();
	},
	_offsetXChanged: function(newValue) {
		var toSet = - newValue + 'px';
		this.$.container.style.left = toSet;
		this.$.container.style.right = toSet;
		if (this.mouseIn) {
			this._move()
		}
	},
	_offsetYChanged: function(newValue) {
		var toSet = - newValue + 'px';
		this.$.container.style.top = toSet;
		this.$.container.style.bottom = toSet;
		if (this.mouseIn) {
			this._move()
		}
	},
	_calcPos: function() {
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
		this._raf = requestAnimationFrame(function() {
			this.transform('translate(' + (this._centerX - this._mouseX) / this._halfWidth * this.offsetX + 'px, ' + (this._centerY - this._mouseY) / this._halfHeight * this.offsetY + 'px)', this.$.container);
			this._chill = false;
		}.bind(this));
	},
	_mousemove: function(e) {
		if (!this.mouseIn) {
			this.mouseIn = true;
			this._calcPos();
			this._asyncRemoveClass = this.async(function() {
				this.toggleClass('animating', false, this.$.container);
			}, Number(this.backToCenterDuration) + 100);
		}
		this._mouseX = e.clientX;
		this._mouseY = e.clientY;
		this._move();
	},
	_mouseleave: function() {
		this.mouseIn = false;
		this.cancelAsync(this._asyncRemoveClass);
		this.toggleClass('animating', true, this.$.container);
		if (this.dissableBackToCenter) {
			return;
		}
		cancelAnimationFrame(this._raf);
		this._chill = false;
		this.transform('none', this.$.container);
	},
	_addListeners: function() {
		this._listenersAdded = true;
		this.mouseListener.addEventListener('mousemove', this._mousemove);
		this.mouseListener.addEventListener('mouseleave', this._mouseleave);
	},
	_removeListeners: function(e) {
		this._listenersAdded = false;
		e = e || this.mouseListener;
		e.removeEventListener('mousemove', this._mousemove);
		e.removeEventListener('mouseleave', this._mouseleave);
	},
	_updateListeners: function() {
		if (this.isAttached && !this.dissableParallax) {
			this._addListeners();
		} else if (this._listenersAdded) {
			this._removeListeners();
		}
	}
});