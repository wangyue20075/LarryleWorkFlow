
UserView = Backbone.View.extend({
	_data: {},
	initialize: function(a, b){
		this._name = a,
		this._template = b
	},
	render: function() {
		if (!this._template) {
			console.error("Null template for userview render");
			return
		}
		var a = _.template($("#template-ui-" + this._template).html()), b = a(this._data);
		$(this.el).html(b)
	}
});

HeaderView = UserView.extend({
	el: "#userview-header",
	initialize: function(){
		UserView.prototype.initialize.call(this, "headerview", "headerview")
	}
});

ControlView = UserView.extend({
	el: "#userview-control",
	initialize: function(){
		UserView.prototype.initialize.call(this, "controlview", "controlview");
	},
	events: {
		"click .choose": "onChooseLinkClicked",
		"click .grid": "onGridLinkClicked",
		"click .save": "onSaveLinkClicked",
		"click .publish": "onPublishLinkClicked",
		"click .sequenceflow": "onSequenceflowLinkClicked"
	},
	render: function(){
		//UserView.prototype.render.call(this);
		
		var self = this;
		
		$("#control-dialog").dialog({
			title: "工具栏",
			resizable: !1,
			width: 100,
			minWidth: 80,
			height: 300,
			position: [10, 50],
			create: function(ev, ui){
				var b = $(this).closest(".ui-dialog");
				$("a.ui-dialog-titlebar-close", b).remove()
			}
		});
		
		$("li.menu-item", this.el).bind({
			mouseenter: function(){
				$(this).addClass("hover")
			},
			mouseleave: function(){
				$(this).removeClass("hover")
			}
		});
		
		$("li.ui-draggable", this.el).draggable({
			appendTo: "body",
			opacity: 0.7,
			cursorAt: {
				left: 2,
				top: 2
			},
			helper: "clone",
			revert: "invalid",
			start: function() {
				self._toggleActiveStyle(), self._changeDesignMode(null)
			}
			
		});
		
	},
	onChooseLinkClicked: function(e){
		this._toggleActiveStyle(e.currentTarget),
		this._changeDesignMode(null)
	},
	onGridLinkClicked: function(e){
		var self = this;
		self._toggleActiveStyle(e.currentTarget),
		self._changeDesignMode(null),
		$("body").toggleClass("grid"),
		setTimeout(function(){
			self._toggleActiveStyle()
		}, 100)
	},
	onSaveLinkClicked: function(e){
		var self = this;
		this._toggleActiveStyle(e.currentTarget),
		window.App.saveApp(function(){
			self.refrash()
		})
	},
	onPublishLinkClicked: function(e){
		var self = this;
		this._toggleActiveStyle(e.currentTarget),
		window.App.publishApp(function(){
			self.refrash()
		})
	},
	onSequenceflowLinkClicked: function(e){
		this._toggleActiveStyle(e.currentTarget),
		this._changeDesignMode("sequenceflow")
	},
	_toggleActiveStyle: function(a){
		$(".menu-item", this.el).removeClass("active"),
		a ? $(a).addClass("active") : $(".menu-item.choose").addClass("active")
	},
	_changeDesignMode: function(a){
		window.App.changeDesignMode(a)
	},
	refrash: function(){
		this._toggleActiveStyle(), this._changeDesignMode(null)
	}
});

PropertyView = UserView.extend({
	el: "#userview-property",
	_control: null,
	initialize: function(){
		UserView.prototype.initialize.call(this, "propertyview", "propertyview")
	},
	render: function(){
		UserView.prototype.render.call(this);
		
		if(this._control){
			var c = [];
			$(".overview", this.el).html("");
			var d = this._control.getPropertiesSorted();
			for (var e = 0; e < d.length; e++) {
				var f = d[e];
				f.property.renderWidget();
				var g = $(f.property.getRenderedWidget());
				$(".overview", this.el).append(g)
			}
			console.log("PROPERTY-VIEW: rendered " + d.length + " properties")
		}
		
	},
	renderForControl: function(a){
		this._control = a,
		this.render()
	},
	refrash: function(){
		this.render()
	}
});

DeviceView = UserView.extend({
	el: "#main-content",
	_draging: !1,
	initialize: function(){
		UserView.prototype.initialize.call(this, "deviceview", "deviceview"),
		this.initEvents()
	},
	initEvents: function(){
		var self = this;
		$(this.el)
			.droppable({
				greedy: !0,
				tolerance: "pointer",
				accept: ".menu-item",
				activate: function(b, c) {
					window.App.onDropActivate(b.originalEvent, c)
				},
				deactivate: function(b, c) {
					window.App.onDropDeactivate(b.originalEvent, c)
				},
				over: function(b, c) {
					window.App.onDropOver(b.originalEvent, c)
				},
				out: function(b, c) {
					window.App.onDropOut(b.originalEvent, c)
				},
				drop: function(b, c) {
					window.App.onDrop(b.originalEvent, c)
				}
			})
			// .mousemove(function(b){
			// 	window.App.onDropTargetMouseMove(b)
			// })
	},
	bindAddedNodeEvents: function(control){
		var self = this,
			graphEl = control.getRenderEl();
				
		graphEl.drag(function(x, y){ //onDragMove			
			self.onMove(control, x, y)
		}, function(x, y){ //onDragStart			
			self.onDragStart(graphEl)
		}, function(ev){ //onDragEnd
			self.onDragEnd(graphEl)
		}).click(function(){
			self.trigger("controlSelected", this.node.id)
		}).mouseover(function(){
			self.onMouseover(this)
		})
		
		//给子元素绑定其父元素的事件
		var child = control.getChildrens();
		for(var i = 0; i < child.length; i++){
			var a = child[i],
				b = a.getRenderEl();
			
			b.drag(function(x, y){ //onDragMove			
				self.onMove(control, x, y)
			}, function(x, y){ //onDragStart			
				self.onDragStart(graphEl)
			}, function(ev){ //onDragEnd
				self.onDragEnd(graphEl)
			}).click(function(){
				self.trigger("controlSelected", graphEl.node.id)
			})
		}
	},
	bindAddedPathEvents: function(control){
		var self = this,
			graphEl = control.getRenderEl();
		
		graphEl.click(function(){
			self.trigger("pathSelected", this.node.id)
		}).mouseover(function(e){
			self.onMouseover(this, e)
		})
	},
	isDraging: function(){
		return this._draging
	},
	onMove: function(control, x, y){
		var el = control.getRenderEl(),
			node = el.node,
			nx = control.x.getValue() + x, 
			ny = control.y.getValue() + y,
			app = window.App,
			pathLookup = app._document.pathLookup,
			n;
			
		if(app.getDesignMode() === "sequenceflow") return !1

		control.relocation([nx, ny]);
		
		//重绘连接线
		for(var k in pathLookup){
			n = pathLookup[k];
			if(n.sourceRef.getValue() === node.id || n.targetRef.getValue() === node.id){
				n.relocation()
			}
		}		
	},
	onDragStart: function(a){		
		a.attr("opacity", 0.5),
		this._draging = !0,
		this.hideNodeButtons(),
		this.hideSelector()
	},
	onDragEnd: function(a){
		a.attr("opacity", 1),
		this._draging = !1,
		this.trigger("locationUpdated", a.node.id, a.attr("x"), a.attr("y"))
	},
	onMouseover: function(a, b){
		this.isDraging() || this.repositionNodeButtons(a, b)
	},
	makeHighlightSelector: function(){
		var app = window.App, 
			paper = app._paper,
			selector = {},
			w = 5,
			h = 5,
			setting = {
				fill : "#000",
				stroke : "#fff"
			};
		
		selector.l = paper.rect(0, 0, w, h).attr(setting),
		selector.lt = paper.rect(0, 0, w, h).attr(setting),
		selector.t = paper.rect(0, 0, w, h).attr(setting),
		selector.rt = paper.rect(0, 0, w, h).attr(setting),
		selector.r = paper.rect(0, 0, w, h).attr(setting),
		selector.rb = paper.rect(0, 0, w, h).attr(setting),
		selector.b = paper.rect(0, 0, w, h).attr(setting),
		selector.lb = paper.rect(0, 0, w, h).attr(setting);
		
		return selector
	},
	/**
	 * a, Raphaël element object 
	 */
	repositionSelector: function(a){
		var b = this._selector || (this._selector = this.makeHighlightSelector()),
			w = 5,
			h = 5,
			targetBox = a.getBBox();
		
		b.l.attr({x: targetBox.x - w / 2, y: targetBox.y - h / 2 + targetBox.height / 2}).show(),
		b.lt.attr({x: targetBox.x - w / 2, y: targetBox.y - h / 2}).show(),
		b.t.attr({x: targetBox.x - w / 2 + targetBox.width / 2, y: targetBox.y - h / 2}).show(),
		
		b.rt.attr({x: targetBox.x - w / 2 + targetBox.width, y: targetBox.y - h / 2}).show(),
		b.r.attr({x: targetBox.x - w / 2 + targetBox.width, y: targetBox.y - h / 2 + targetBox.height / 2}).show(),
		b.rb.attr({x: targetBox.x - w / 2 + targetBox.width, y: targetBox.y - h / 2 + targetBox.height}).show(),
		
		b.b.attr({x: targetBox.x - w / 2 + targetBox.width / 2, y: targetBox.y - h / 2 + targetBox.height}).show(),
		b.lb.attr({x: targetBox.x - w / 2, y: targetBox.y - h / 2 + targetBox.height}).show()
	},
	hideSelector: function(){
		var b = this._selector;
		b && (
			b.l.hide(),
			b.lt.hide(),
			b.t.hide(),
			b.rt.hide(),
			b.r.hide(),
			b.rb.hide(),
			b.b.hide(),
			b.lb.hide()
		)
	},
	makeNodeButtons: function(){
		var self = this,
			buttons = $('<div class="node-buttons"><a href="javascript:void(0);" title="复制" class="icon icon-copy"></a> <a href="javascript:void(0);" title="删除" class="icon icon-delete"></a></div>').appendTo("body")
		return $("a.icon-copy", buttons).bind("click", function(){
				var target = $(this).parent().attr("for");
				self.trigger("controlDuplicated", target)
			}),
			$("a.icon-delete", buttons).bind("click", function(){
				var target = $(this).parent().attr("for");
				self.trigger("controlDeleted", target)
			}),
			buttons
	},
	/**
	 * a, Raphaël element object 
	 */
	repositionNodeButtons: function(a, c){
		var b = this._buttons || (this._buttons = this.makeNodeButtons()),
			targetBox = a.getBBox();
		
		b.css({
			left: targetBox.x + targetBox.width - 46,
			top: targetBox.y + targetBox.height + 30,
			width: c ? 19 : 38
		}).attr("for", a.node.id).show().find("a:first")[c ? "hide" : "show"]()
	},
	hideNodeButtons: function(){
		this._buttons && this._buttons.hide()
	},
	addControlToDevice: function(control, point){
		control.renderTo(point),
		this.bindAddedNodeEvents(control)
	},
	addPathToDevice: function(control, from, to){
		control.renderTo(from, to),
		this.bindAddedPathEvents(control)
	},
	selecteControl: function(a, b){
		var el = a.getRenderEl();		
		this.repositionSelector(el),
		this.repositionNodeButtons(el, b)
	},
	deselectAllControls: function(){
		this.hideNodeButtons(),
		this.hideSelector()
	},
	removeControl: function(control){
		console.log("removeControl", control.getId());
		control.getRenderEl().remove()
	},
	updateControl: function(control){
		control.redraw()
	}
});

