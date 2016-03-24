/**
 * 	jQuery Selector UI Widget 1.0 
 *
 * 	Depends: 
 *	   - jQuery 1.4.2+
 * 	Auther:
 *     - Gavin Li 2012.08.09
 *  Update:
 *     - 2012.10.08
 * 
 *  Reference resources: jquery.multiselect.js (http://www.erichynds.com/jquery/jquery-ui-multiselect-widget)
 * 	Example: 		
		<select name="example" multiple="multiple">
			<option value="option1">Option 1</option>
			<option value="option2" selected="true">Option 2</option>
			<option value="option3">Option 3</option>
		</select>
		
		$('select').filterSelector({
			multiple: false,
			click: function(){
				// todo
			}
		});
 */
(function($){

	var selectorID = 0;
	var rEscape = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
	
	$.extend($.fn, {
		filterSelector: function(options){
			return this.each(function(){
				var selector = $.data(this, 'selector');
				if(!selector){
					selector = new $.filterSelector(options, this);
					$.data(this, 'selector', selector);
				}
			});
		}
	});
	
	$.filterSelector = function(options, el){	
		if ( arguments.length ) {
			this.init( options, el );
		}			
	};
	
	$.filterSelector.prototype = {
		eventPrefix: "",
		speed: $.fx.speeds._default, // default speed for effects
		isOpen: false,
		checkAllFlag: false,
		minWidth: 100, // min width for selector

		options: {
			header: true, // show header
			height: 175, // list height
			width: '', // selector width
			style: '',
			checkAllText: 'Check all / Uncheck all',
			noneSelectedText: 'Select options',
			selectedText: '# selected',
			displaySelectedText: false,
			selectedList: 2,
			multiple: true,
			filter: false, // filter keyword
			groupSelected: false // group by selected
		},
				
		// init data
		init: function(options, el){
			
			var o = (this.options = $.extend(true, {}, this.options, options));
							
			this.element = $(el);

			this.selector = $('<span />')
				.addClass('selector')
				.attr({'title': this.element.attr('title'), 'style': o.style})
				.insertAfter( this.element ),
				
			this.input = $('<input ' + (o.multiple === false || o.filter === false ? 'readonly="true"' : '') + ' ></input>')
				.addClass('selector-input')
				.appendTo(this.selector),
				
			this.button = $('<a href="#"></a>')
				.addClass('selector-button')
				.appendTo(this.selector),
				
			this.menu = $('<div />')
				.addClass('selector-menu')
				.appendTo( document.body );
			
			
			
			if(o.header !== false){
				this.header = $('<div />')
					.addClass('selector-menu-header')
					.appendTo( this.menu ),
				this.headerLinkContainer = $('<ul />')
					.html(function(){
						var str = '';
						if(typeof o.header === "string"){
							str += '<li>' + o.header + '</li>';
						} else if(o.header === true && o.multiple === true){
							str += '<li><a class="selector-menu-checklink" href="#"><span>' + o.checkAllText + '</span></a></li>';
						}
						str += '<li class="li-close"><a href="#" class="selector-menu-close"><span class="icon-close"/></a></li>';
						return str;
					})
					.appendTo( this.header );
			}
										
			
			this.checkboxContainer = $('<div />')
				.addClass('selector-menu-list')
				.addClass( o.multiple ? '' : 'selector-menu-single')
				.append('<ul />')
				.appendTo( this.menu );
	
			this.build();
			this.cache();
			this.bindEvents();			
		},
		
		// build menu
		build: function(){
			var el = this.element,
				o = this.options,
				html = "",
				id = selectorID++; // unique ID for the label & option tags
				
			el.hide();
			
			// build items
			el.find('option').each(function( i ){
				var $this = $(this), 
					parent = this.parentNode,
					title = this.innerHTML,
					description = this.title,
					value = this.value,
					inputID = 'selector-' + id + '-option-' + i,
					isDisabled = this.disabled,
					isSelected = this.selected,
					labelClasses = [];			
			
				if( isDisabled ){
					labelClasses.push( 'disabled' );
				}

				// browsers automatically select the first option
				// by default with single selects
				if( isSelected && !o.multiple ){
					labelClasses.push( 'item-active' );
				}
				
				html += '<li>';
				
				// create the label
				html += '<label for="' + inputID + '" title="' + description + '" class="' + labelClasses.join(' ') + '">';
				html += '<input id="' + inputID + '" name="selector_' + id + '" type="' + (o.multiple ? "checkbox" : "radio") + '" value="' + value + '" title="' + title + '"';

				// pre-selected?
				if( isSelected ){
					html += ' checked="checked"';
					//html += ' aria-selected="true"';
				}

				// disabled?
				if( isDisabled ){
					html += ' disabled="disabled"';
					//html += ' aria-disabled="true"';
				}

				// add the title and close everything off
				html += ' /><span>' + title + '</span></label></li>';
			});
			
			// insert into the DOM
			this.checkboxContainer.find('ul').html( html );
			
			this.labels = this.checkboxContainer.find('label');
			this.inputs = this.checkboxContainer.find('input');
			
			this.setSelectorWidth();
			this.setMenuWidth();
			
			// remember default value
			this.button[0].defaultValue = this.update();
		},
		
		// updates the button text.
		update: function(){
			var o = this.options,
				$checkboxContainer = this.checkboxContainer,
				$inputs = this.inputs.filter(function(){
					return $.css($(this).parents('li')[0], "display") !== 'none';
				}),
				$checked = $inputs.filter(':checked'),
				numChecked = $checked.length,				
				value;
			
			$('.group-line', $checkboxContainer).remove();
			
			if( numChecked === 0 ){
				value = o.noneSelectedText;
			} else {
													
				if($.isFunction( o.selectedText )){
					value = o.selectedText.call(this, numChecked, $inputs.length, $checked.get());
				} else if( /\d/.test(o.selectedList) && o.selectedList > 0 && numChecked <= o.selectedList){
					value = $checked.map(function(){ return $(this).next().html(); }).get().join(', ');
				} else {
					// 2 selected / 2 of 10 selected
					value = o.selectedText.replace('#', numChecked).replace('#', $inputs.length);;
				}
				
				// group by selected
				if(o.multiple === true && o.groupSelected === true && numChecked != $inputs.length){
					var $checkedList = $('input:checked', $checkboxContainer).parents('li').detach();
					
					//ie6 bug
					$checkedList.find('input').each(function(){
						this.checked = true;
					});
					
					$('li:first', $checkboxContainer).before($checkedList).before('<li class="group-line"></li>');
				}
				
			}
			
			if(o.displaySelectedText === true || numChecked === 0 || o.multiple === false) this.input.val(value);
			
			return value;
		},
		
		// bind events
		bindEvents: function(){
			var self = this, selector = this.selector, input = this.input, button = this.button, o = this.options;
						
			if(o.multiple === true && o.filter === true){
				input.bind({
					keydown: function( e ){
						switch(e.which){
							case 13: // prevent the enter key from submitting the form / closing the widget
								e.preventDefault();
								break;
							case 38: // up
							case 40: // down
								self.checkboxContainer.find('li:first label').trigger('mouseenter.selector');
								break;
						}
					},
					keyup: function(){
						self._filter();
					},
					focus: function(){
						if(!input.hasClass('selector-input-active')){						
							input.addClass('selector-input-active');
						}
						$(this).select();
					},
					blur: function(){
						input.removeClass('selector-input-active');
						if(!$.trim(input.val())){
							input.val(o.noneSelectedText);
						}
					}
				});
			}
			
			button.bind({
				click: function(){
					if(self.isOpen){
						self.close();
					}else{
						if(self.getInputValue() === o.noneSelectedText){
							self.rows.show();
							self.update();
						}
						self.open();
					}
					
					//self[ self.isOpen ? 'close' : 'open' ]();
					return false;
				}
			});
			
			// header links
			if(o.header !== false){
				this.header
					.delegate('a', 'click.selector', function( e ){						
						// close / checkAll or uncheckAll
						if( $(this).hasClass('selector-menu-close') ){
							self.close();
						}else if($(this).hasClass('selector-menu-checklink')){
							self.checkAll((self.checkAllFlag = !self.checkAllFlag));
						}	
						e.preventDefault();
						return false;
					});
			};
			
			// menu list
			this.checkboxContainer
				//label.mouseenter
				.delegate('label', 'mouseenter.selector', function(){
					if( !$(this).is('.disabled, .group-line') ){
						self.labels.removeClass('item-hover');
						$(this).addClass('item-hover').find('input').focus();
					}
				})
				//label.keydown
				.delegate('label', 'keydown.selector', function(e){
					e.preventDefault();
				
					switch(e.which){
						case 9: // tab
						case 27: // esc
							self.close();
							break;
						case 38: // up
						case 40: // down
						case 37: // left
						case 39: // right
							self._traverse(e.which, this);
							break;
						case 13: // enter
							$(this).find('input')[0].click();
							break;
					}
				})
				//input.click
				.delegate('input[type="checkbox"], input[type="radio"]', 'click.selector', function( e, isTrigger ){
					var $this = $(this),
						val = this.value,
						checked = isTrigger || this.checked,
						tags = self.element.find('option');
					
					// bail if this input is disabled or the event is cancelled
					if( this.disabled || isTrigger ? 0 : self._trigger('click', e, { value: val, text: this.title, checked: checked }) === false ){
						e.preventDefault();
						return;
					}
										
					// make sure the input has focus. otherwise, the esc key
					// won't close the menu after clicking an item.
					$this.focus();
					
					// toggle aria state
					$this.attr('aria-selected', checked);
					
					// change state on the original option tags
					tags.each(function(){
						if( this.value === val ){
							this.selected = checked;
						} else if( !o.multiple ){
							this.selected = false;
						}
					});
					
					// some additional single select-specific logic
					if( !o.multiple ){
						self.labels.removeClass('item-active');
						$this.closest('label').toggleClass('item-active', checked );
						
						// close menu
						self.close();
					}

					// fire change on the select box
					if(!isTrigger) {
						self.element.trigger("change");												
					}
					
					// setTimeout is to fix selector issue #14 and #47. caused by jQuery issue #3827
					// http://bugs.jquery.com/ticket/3827 
					setTimeout($.proxy(self.update, self), 10);
					
				});
			
			// close each widget when clicking on any other element/anywhere else on the page
			$(document).bind('mousedown.selector', function( e ){
				if(self.isOpen && !$.contains(self.menu[0], e.target) && !$.contains(self.button[0], e.target) && e.target !== self.button[0]){
					self.close();
				}
			});
			
		},
		
		//open selector list
		open: function(){
			var selector = this.selector,
				menu = this.menu,
				o = this.options,
				val = $.trim(this.input.val());
			
			// bail if the beforeopen event returns false, this widget is disabled, or is already open 
			if( selector.hasClass('selector-disabled') || this.isOpen || this._trigger('beforeopen') === false ){
				return;
			}
			
			var	pos = selector.offset();

			// set the scroll of the checkbox container
			this.checkboxContainer.scrollTop(0).height(o.height).find('ul').height(o.height);
			
			// show menu
			menu.css({ 
				top: pos.top + selector.outerHeight() + 1,
				left: pos.left
			}).show();			
			
			// select the first option
			// triggering both mouseover and mouseover because 1.4.2+ has a bug where triggering mouseover
			// will actually trigger mouseenter.  the mouseenter trigger is there for when it's eventually fixed
			//this.labels.eq(0).trigger('mouseover').trigger('mouseenter').find('input').trigger('focus');
			
			this.input.addClass('selector-input-active');
			this.button.addClass('selector-button-active');
			this.isOpen = true;
			this._trigger('open');
		},
		
		// close list
		close: function(){
			if(this.options.isOpen === false || this._trigger('beforeclose') === false){
				return;
			}
		
			this.menu.hide();
			this.input.removeClass('selector-input-active');
			this.button.removeClass('selector-button-active');
			this.isOpen = false;
			this._trigger('close');
		},
		
		// checkAll or uncheckAll
		checkAll: function(flag){
			this._toggleChecked(flag);
		},
		
		// get selected text
		getSelectedText: function(){
			if(this.options.multiple === true){
				$checked = this.inputs.filter(':checked');
				return $checked.map(function(){
					return $(this).attr('title');
				}).get().join(',');
			}			
			return this.inputs.filter(':checked').attr('title');			
		},
		
		// get selected value
		getSelectedValue: function(){
			if(this.options.multiple === true){
				$checked = this.inputs.filter(':checked');
				return $checked.map(function(){
					return $(this).val();
				}).get().join(',');
			}			
			return this.inputs.filter(':checked').val();
		},		
		
		// set selected option by values
		setSelectedOptions: function(values){
			if(values === undefined) return;
						
			var $self = this, 
			values = "" + values; //避免传的值为number后使用split()报错
			
			$self._toggleChecked(0, 1), // 全设为false
			$self.labels.removeClass('item-hover'),
			$.each(values.split(','), function(i, n){
				//trigger('click') 触发复选框click事件时，其handler拿到的是点击之前的状态，和界面操作不同。
				$self.inputs.filter(':[value="' + n + '"]').trigger('click', 1);
			});
						
		},
		
		// toggle selector state
		disableSelector: function(state){
			this.close(),
			this.selector.toggleClass("selector-disabled", state === true)
		},
		
		// set width of selector
		setSelectorWidth: function(){
			var o = this.options;
				
			if( /\d/.test(o.width) && o.width > this.minWidth ){
				this.input.width( o.width );
			}			
		},
	
		// set width of menu
		setMenuWidth: function(){
			var m = this.menu,
				width = this.input.outerWidth()-
					parseInt(m.css('padding-left'),10)-
					parseInt(m.css('padding-right'),10)-
					parseInt(m.css('border-right-width'),10)-
					parseInt(m.css('border-left-width'),10);
					
			m.width( width || this.input.outerWidth() );
		},
						
		cache: function(){
			// each list item
			this.rows = this.checkboxContainer.find("li:not(.group-line)");
			
			// cache options
			this.cache = this.element.children().map(function(){
				var self = $(this);	
				
				return self.map(function(){
					return this.innerHTML.toLowerCase();
				}).get();
			}).get();
		},
	
		getInputValue: function(){
			return $.trim(this.input.val());
		},
		
		// filter options
		_filter: function(e){
			var term = this.getInputValue(), rows = this.rows, inputs = this.inputs, cache = this.cache;
			
			if( !term ){
				rows.show();
			} else {
				rows.hide();
				
				var regex = new RegExp(term.toLowerCase().replace(rEscape, "\\$&"), 'gi');
				
				this._trigger( "filter", e, $.map(cache, function(v, i){
					if( v.search(regex) !== -1 ){
						rows.eq(i).show();
						return inputs.get(i);
					}					
					return null;
				}));
			}
			
			if(!this.isOpen){
				if(!term && inputs.filter(':checked').length > 0){
					this.update();
				}
				this.open();
			}
		},
		
		// toggle check state
		_toggleChecked: function( flag, preventDefault ){
			var self = this, $inputs = this.inputs.filter(function(){
					return !this.disabled && $.css($(this).parents('li')[0], "display") !== 'none';
				});

			// toggle state on inputs
			$inputs.each(this._toggleState('checked', flag));

			// give the first input focus
			$inputs.eq(0).focus();
			
			// update button text
			this.update();
			
			// gather an array of the values that actually changed
			var values = $inputs.map(function(){
				return this.value;
			}).get();

			// toggle state on original option tags
			this.element
				.find('option')
				.each(function(){
					if( $.inArray(this.value, values) > -1 ){
						self._toggleState('selected', flag).call( this );
					}
				});

			// trigger the change event on the select
			if( $inputs.length && !preventDefault ) {
				this.element.trigger("change");
			}
		},
		
		// This is an internal function to toggle the checked property and
		// other related attributes of a checkbox.
		//
		// The context of this function should be a checkbox; do not proxy it.
		_toggleState: function( prop, flag ){
			return function(){			
				this[ prop ] = flag;

				/*if( flag ){
					this.setAttribute('aria-selected', true);
				} else {
					this.removeAttribute('aria-selected');
				}*/
			};
		},
		
		// move up or down within the menu
		_traverse: function( which, start ){
			var $start = $(start),
				moveToLast = which === 38 || which === 37,
				
				// select the first li that isn't an optgroup label / disabled
				$next = $start.parent()[moveToLast ? 'prevAll' : 'nextAll']('li:not(.selector-disabled)')[ moveToLast ? 'last' : 'first']();
			
			// if at the first/last element
			if( !$next.length ){
				var $container = this.menu.find('ul').last();
				
				// move to the first/last
				this.menu.find('label')[ moveToLast ? 'last' : 'first' ]().trigger('mouseover');
				
				// set scroll position
				$container.scrollTop( moveToLast ? $container.height() : 0 );
				
			} else {
				$next.find('label').trigger('mouseover');
			}
		},
		
		// @see jquery.ui.widget.js
		_trigger: function( type, event, data ) {
			var prop, orig,
				callback = this.options[ type ];

			data = data || {};
			event = $.Event( event );
			event.type = ( type === this.eventPrefix ?
				type :
				this.eventPrefix + type ).toLowerCase();
			
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
			
			//使用trigger()时，在IE6下，选其它选项时，会把element的第一项也选中，未知原因
			//使用triggerHandler()的话，在jquery1.6.2-版本中选取选项时被还原（复选框选取状态）
			this.element.trigger( event, data );

			//前面使用triggerHandler()的话，jQuery 1.6.2-,event.isDefaultPrevented()返回true
			return !( $.isFunction(callback) && callback.call( this.element[0], event, data ) === false || event.isDefaultPrevented() );				
			//return !( $.isFunction(callback) && callback.call( this.element[0], event, data ) === false );
		}
		
	};
	
	$.extend($.fn, {
		getSelectedText: function(){
			return this.data("selector") ? this.data("selector").getSelectedText() : ""
		},
		getSelectedValue: function(){
			return this.data("selector") ? this.data("selector").getSelectedValue() : ""
		},
		setSelectedOptions: function(a){
			return this.data("selector") && this.data("selector").setSelectedOptions(a), this
		},
		disableSelector: function(a){
			return this.data("selector") && this.data("selector").disableSelector(a), this
		},
		refreshSelector: function(){
			return this.data("selector") && this.data("selector").build(), this
		}
	});
	
})(jQuery);	