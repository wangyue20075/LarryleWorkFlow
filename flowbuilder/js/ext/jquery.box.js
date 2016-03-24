/**
 * jQuery popup layer plugin
 *
 * 	Depends: 
 *	   - jQuery 1.4.2+
 * 	Auther:
 *     - Gavin Li 2012.09.23
 *  Update:
 *     - 2012.09.24
 */
(function($){

	$.extend($.fn, {
		box: function(options){
			return this.each(function(){
				var box = $.data(this, "box");
				if(!box){
					box = new $.box(options, this);
					$.data(this, "box", box);
				}
			});
		}
	});

	$.box = function(options, el){
		if (arguments.length) {
			this._init(options, el);
		}
	}
	
	$.box.prototype = {
		isOpen: false,		
		options: {
			title: 'Box',
			boxClass: '',
			height: 'auto',
			width: 'auto',
			position: false,
			modal: false,
			autoOpen: false,
			btnClose: false, //element or id
			effects: false
		},
		_init: function(options, el){
			this.options = $.extend(true, {}, this.options, options),						
			this.element = $(el),						
			this._create(),
			this._bindEvents(),
			this.options.autoOpen && this.open()
				
		},
		_create: function(){
			var o = this.options, el = this.element;
			this.box = $("<div />")				
				.hide()
				.addClass("box")
				.addClass(o.boxClass)
				.appendTo("body"),
			this.header = $("<div />")
				.addClass("box-header")				
				.append($("<span />").addClass("box-title").html(o.title))
				.appendTo(this.box),				
			this.content = $("<div />")
				.addClass("box-content")
				.css({
					height: o.height,
					width: o.width
				})
				.append(el.show())				
				.appendTo(this.box),
			this.iframe = $("<iframe frameborder='0' border='0' />")
				.addClass("lay")
				.appendTo(this.box),
			o.modal === true && this._createOverlay(),
			this._trigger("create")
		},
		_createOverlay: function(){
			if(this.overlay) return; 
			this.overlay = $("<div />")
				.hide()
				.addClass("box-overlay")
				.css({
					width: this._docWidth(),
					height: this._docHeight()				
				})
				.append("<div class='back' /><iframe frameborder='0' border='0' class='lay' />")
				.appendTo("body");			
		},
		_bindEvents: function(){
			var self = this, o = this.options;
			
			$(window).bind("resize", function(){
				o.modal === true && self.overlay.css({
					width: self._docWidth(),
					height: self._docHeight()
				}),
				self._position(o.position)
			});

			if(o.btnClose){
				if(typeof(o.btnClose) == "object"){
					$(o.btnClose).click($.proxy(self.close, self))
				}else if(typeof(o.btnClose) == "string"){
					$("#" + o.btnClose).click($.proxy(self.close, self))
				}
			}
		},
		open: function(){
			if(this.isOpen) return; 
			var self = this, o = this.options;
			self._position(o.position),
			o.modal === true && self.overlay.show(),
			o.effects ? self._doEffects("open") : self.box.show(),
			self._trigger("open"),
			self.isOpen = true
		},
		close: function(){
			if(!this.isOpen) return;
			var self = this, o = this.options;		
			o.effects ? self._doEffects("close") : self.box.hide(),
			self.overlay && self.overlay.hide(),
			self._trigger("close"),
			self.isOpen = false
		},
		_doEffects: function(way){
			"open" == way ? this.box.show("slow") : this.box.hide("slow")
		},
		_docHeight: function(){
			var scrollHeight,
				offsetHeight;
			// handle IE 6
			if ($.browser.msie && $.browser.version < 7) {
				scrollHeight = Math.max(
					document.documentElement.scrollHeight,
					document.body.scrollHeight
				);
				offsetHeight = Math.max(
					document.documentElement.offsetHeight,
					document.body.offsetHeight
				);

				if (scrollHeight < offsetHeight) {
					return $(window).height() + 'px';
				} else {
					return scrollHeight + 'px';
				}
			// handle "good" browsers
			} else {
				return $(document).height() + 'px';
			}
		},
		_docWidth: function() {
			var scrollWidth,
				offsetWidth;
			// handle IE
			if ( $.browser.msie ) {
				scrollWidth = Math.max(
					document.documentElement.scrollWidth,
					document.body.scrollWidth
				);
				offsetWidth = Math.max(
					document.documentElement.offsetWidth,
					document.body.offsetWidth
				);

				if (scrollWidth < offsetWidth) {
					return $(window).width() + 'px';
				} else {
					return scrollWidth + 'px';
				}
			// handle "good" browsers
			} else {
				return $(document).width() + 'px';
			}
		},
		_position: function(p){
			this.box.css({
				left: p && p.left || ($(document).width() - this.box.width()) / 2,
				top: p && p.top || (document.documentElement.clientHeight - this.box.height()) / 2 + $(document).scrollTop()
			})
		},
		// @see jquery.ui.widget.js
		_trigger: function( type, event, data ) {
			var prop, orig,
				callback = this.options[ type ];

			data = data || {};
			event = $.Event( event );
			event.type = ( type === this.eventPrefix ? type : this.eventPrefix + type ).toLowerCase();
			
			// the original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[ 0 ];

			// copy original event properties over to the new event
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}
			
			this.element.trigger( event, data );

			return !( $.isFunction(callback) &&
				callback.call( this.element[0], event, data ) === false ||
				event.isDefaultPrevented() );
		}
	}
	
	$.extend($.fn, {
		open: function(){
			$(this).data("box") && $(this).data("box").open()
		},
		close: function(){
			$(this).data("box") && $(this).data("box").close()
		}
	});
	
})(jQuery);

