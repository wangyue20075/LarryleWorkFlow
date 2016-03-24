
Builder = Backbone.View.extend({
	_document: {
		root: null,
		lookup: {},
		pathLookup: {}
	},
	_views: {},
	_designMode: null,
	_sourceNode: null,
	_dragDropTarget: null,
	_selectedControl: null,
	_loading: !1,
	initialize: function(){},
	render: function(){
		var win = $(window);		
		this._renderHeaderView(),
		this._renderControlView(),
		this._renderPropertyView(),
		this._renderDeviceView(),
		this._bindDeviceEvents(),
		this._bindEvents(),
		this._paper = Raphael($(this.getDevice().el).get(0), win.width() * 1.5, win.height() * 1.5),
		this.trigger("appInited")
	},
	getHeaderView: function(){
		return this._views.headerview
	},
	getControlView: function(){
		return this._views.controlview
	},
	getPropertyView: function(){
		return this._views.propertyview
	},
	getDevice: function(){
		return this._views.deviceview
	},
	_renderHeaderView: function(){
		this._views.headerview = new HeaderView
	},
	_renderControlView: function(){
		var a = new ControlView();
		a.render(),
		this._views.controlview = a
	},
	_renderPropertyView: function(){
		var a = new PropertyView();
		a.render(),
		this._views.propertyview = a
	},
	_renderDeviceView: function(){
		this._views.deviceview = new DeviceView	
	},
	_bindDeviceEvents: function(){
		var a = this._views.deviceview, b = this;
		
		a.bind("controlSelected", function(c){
			console.log("controlSelected");
			var d = b.getControl(c);
			d && b.onControlSelected(d)
		}).bind("locationUpdated", function(c, x, y){
			var d = b.getControl(c);
			d && d.setLocation([x, y])
		}).bind("controlDuplicated", function(c){
			console.log("controlDuplicated", c);
			var d = b.getControl(c);
			d && b.onControlDuplicated(d)
		}).bind("controlDeleted", function(c){
			console.log("controlDeleted", c);
			var d = b.getControl(c);
			d && b.onControlDeleted(d)
		}).bind("pathSelected", function(c){
			console.log("pathSelected");
			var d = b.getControl(c);
			d && b.onPathSelected(d)
		})
	},
	_bindEvents: function(){
		var a = this;
		this.bind("appLoading", function(){
			a._loading = !0
		}).bind("appLoaded", function(){
			a._loading = !1
		})
	},
	changeDesignMode: function(a){
		this._designMode = a,
		a === null && (this._sourceNode = null)
	},
	getDesignMode: function(){
		return this._designMode
	},
	setSourceNode: function(a){
		this._sourceNode = a
	},
	getSourceNode: function(){
		return this._sourceNode
	},
	isLoading: function(){
		return this._loading
	},
	_bindAddControlEvents: function(a){
		var b = this;
		a.bind("controlRendered", function(){
			console.log("controlRendered", this.getId())
			b.getControlView().refrash()
		}).bind("controlUpdated", function(a, c) {			
			//if(b.isLoading()) return;
			b.getDevice().updateControl(a),			
			c && b.getPropertyView().refresh()
		}).bind("childAdded", function(a){
			console.log("childAdded", a.getId(), a.getParentControl().getId()),
			b._document.lookup[a.getId()] = a,
			b._bindAddControlEvents(a)
		}).bind("childRemoved", function(a) {
			console.log("childRemoved", a.getId()),
			delete b._document.lookup[a.getId()]		
		})
	},
	addControl: function(controlType, point){
		var control = ControlFactory.newControl(controlType);
		if(!control){
			console.error("unable to construct control of type: ", controlType);
			return;
		}
		this._addControl(control, point)
	},
	_addControl: function(control, point){
		control.hasAlreadyAfterBound() || (this._bindAddControlEvents(control), control.onAfterBind(), control.setAlreadyAfterBound(!0)),
		this.getDevice().addControlToDevice(control, point || [control.x.getValue(), control.y.getValue()]),
		this.onControlSelected(control),
		this._addChildControl(control)
	},
	_addChildControl: function(a){
		this._document.root.addChild(a),
		this._document.lookup[a.getId()] = a,
		console.log("controlAdded", a.getId())
	},
	onControlDeleted: function(control){
		this.deselectAllControls(),
		control.getControlType() === "sequenceflow" ? this._resetControlFromRemovedPath(control) : this._cleanupPathFromRemovedControl(control),
		this._cleanupChildrenFromRemovedControl(control)	
	},
	_cleanupChildrenFromRemovedControl: function(a){
		var b = [], c, device = this.getDevice();
		b.push(a);
		while (b.length) {
			//返回数组中的第一个元素，并删除它
			c = b.shift(),
			delete this._document.lookup[c.getId()],
			device.removeControl(c),
			c.getParentControl() && c.getParentControl().removeChild(c)
			for (var d = 0; d < c._childrens.length; d++) {
				var e = c._childrens[d];
				//向数据里添加元素，以便循环
				b.splice(0, 0, e)
			}
		}
	},
	_cleanupPathFromRemovedControl: function(a){
		var b, c = a.getId(), d = this._document.pathLookup, f, g, h;
		for(var n in d){
			f = d[n], g = f.sourceRef.getValue(), h = f.targetRef.getValue();
			if(g === c || h === c){
				delete this._document.pathLookup[f.getId()],
				this._cleanupChildrenFromRemovedControl(f);

				//重置连线的sourceRef, targetRef控件属性
				if(g === c){
					b = this.getControl(h),
					b && b.sourceRef.setValue("")
				}else{
					b = this.getControl(g),
					b && b.targetRef.setValue("")
				}
			}
		}
		
	},
	_resetControlFromRemovedPath: function(a){
		var b;
		b = this.getControl(a.sourceRef.getValue()),
		b && b.targetRef.setValue(""),
		b = this.getControl(a.targetRef.getValue()),
		b && b.sourceRef.setValue("")
	},
	onControlDuplicated: function(control){
		var a = control.cloneControl(),
			el = control.getRenderEl();
		a.setAlreadyAfterBound(!0),
		this._addControl(a, [el.attr("x") + 20, el.attr("y") + 20])
	},
	getControl: function(a){
		return this._document.lookup[a]
	},
	_bindAddPathEvents: function(a){
		var b = this;
		a.bind("pathAdded", function(from, to){
			var fromControl = b.getControl(from),
				toControl = b.getControl(to);
			//保存节点的path信息	
			fromControl.targetRef.setValue(to),
			toControl.sourceRef.setValue(from)
		})
	},
	acceptAddPath: function(from, to){
		var fromControl = this.getControl(from),
			fromType = fromControl.getControlType(),
			ft = fromControl.targetRef.getValue(),
			toControl = this.getControl(to),
			toType = toControl.getControlType(),
			ts = toControl.sourceRef.getValue(),
			result = !0;
		
		//单向顺序流
		if(fromType === "startevent"){
			result = ft === "" ? (toType === "endevent" ? !1 : ts === "") : !1			
		}else if(fromType === "endevent"){
			result = !1
		}else{
			result = ft === "" ? (toType === "startevent" ? !1 : ts === "") : !1
		}
		return result
	},
	addPath: function(from, to){
		var control = ControlFactory.newControl("sequenceflow");
		this.acceptAddPath(from, to) && this._addPath(control, from, to)
	},
	_addPath: function(control, from, to){
		var from = from || control.sourceRef.getValue(), to = to || control.targetRef.getValue();		
		control.hasAlreadyAfterBound() || (this._bindAddControlEvents(control), control.onAfterBind(), control.setAlreadyAfterBound(!0)),
		this.getDevice().addPathToDevice(control, from, to),
		this._addChildControl(control),
		this._document.pathLookup[control.getId()] = control
	},
	deselectAllControls: function(){
		this.hidePropertyDialog(),
		this.getDevice().deselectAllControls()
	},
	onControlSelected: function(a){
		if (this.isLoading()) return;

		//节点连接
		if(this.getDesignMode() === "sequenceflow"){
			var from = this.getSourceNode(), to = a.getId();
			if(from && from !== to){
				this.addPath(from, to)
			}
			this.setSourceNode(to)
		}
		
		this.setSelectedControl(a),
		this.getPropertyView().renderForControl(a),
		this.showPropertyDialogForControl(a),
		this.getDevice().selecteControl(a)
	},
	onPathSelected: function(a){
		this.getDesignMode() === "sequenceflow" || (this.deselectAllControls(), this.getDevice().selecteControl(a, !0))
	},
	setSelectedControl: function(a){
		this._selectedControl = a
	},
	getSelectedControl: function(){
		return this._selectedControl
	},
	hidePropertyDialog: function(){
		this._propertyDialog && this._propertyDialog.dialog("close")
	},
	showPropertyDialogForControl: function(a){
		var b = this, dlg = this._propertyDialog, dialogWidth = 316, maxHeight = 500;						
		if (!dlg) {
			dlg = this._propertyDialog = $("#property-dialog").dialog({				
				autoOpen: !1,
				resizable: !1,
				width: dialogWidth,
				maxHeight: maxHeight,
				dialogClass: "property-dialog",
				position: [$(window).width() - dialogWidth - 40, 100],
				create: function(ev, ui) {
					var c = $(this).closest(".ui-dialog"),
					e = $(".ui-dialog-titlebar", c);
					$(".ui-dialog-titlebar-close", e).html('<span class="bui-icon-dialogclose"></span>')
				}
			})
		}
						
		dlg.dialog("open")
		
		//重设dialog标题等属性
		dlg.dialog("option", {
			title: a.getName().toUpperCase(),
			//position: [$(window).width() - dialogWidth - 40, 100],
			height: Math.min($("#userview-property .overview").height() + 55, maxHeight)
		})
	},
	publishApp: function(){
		
	},
	saveApp: function(options, callback){
		var a = this, 
			b = new ControlOutputVisitor,
			back = typeof options === "function" ? options : callback,
			o = typeof options === "function" || !options ? {} : options,
			data = $.extend({}, {
				doc: JSON.stringify(b.getAppDocument(this._document.root))
			}, o);
			
		alert(JSON.stringify(b.getAppDocument(this._document.root)))
		
		back && back.call(this)
		
		// Utils.request({
			// url: a.getSitePath() + "saveBasePageTemp.action",
			// type: "post",
			// data: data,
			// showLoading: e.showLoading === undefined ? true : e.showLoading === true, 
			// success: function(d){
				// console.log("BUILDER: save success"), back && back()
			// }
		// })
	},
	loadApp: function(){
		// var a = this;
		this.trigger("appLoading"),
		// Utils.request({
			// url: a.getSitePath() + "toEditPageTemp.action",
			// data: {
				// pageId: Utils.getQueryParameter("appId")
			// },
			// success: function(b){
				// a.openFromObject(b)
				//a.trigger("appLoaded")
			// }
		// })
		this.openFromObject({
			doc: {
				"type": "app",
				"id": "1001",
				"properties": {},
				"children": [{
					"type": "startevent",
					"id": "startevent159438",
					"properties": {
						"x": 240,
						"y": 370,
						"name": "开始",
						"sourceRef": "",
						"targetRef": "usertask716081"
					},
					"children": []
				},
				{
					"type": "usertask",
					"id": "usertask716081",
					"properties": {
						"x": 373,
						"y": 314,
						"name": "任务1",
						"sourceRef": "startevent159438",
						"targetRef": "usertask97798",
						"assignee": "user1",
						"assigneeType": "user"
					},
					"children": [{
						"type": "textnode",
						"id": "textnode939663",
						"properties": {
							"x": 0,
							"y": 0,
							"name": "name",
							"sourceRef": "",
							"targetRef": "",
							"text": "任务1"
						},
						"children": []
					}]
				},
				{
					"type": "usertask",
					"id": "usertask97798",
					"properties": {
						"x": 498,
						"y": 175,
						"name": "任务2",
						"sourceRef": "usertask716081",
						"targetRef": "endevent598210",
						"assignee": "role1",
						"assigneeType": "role"
					},
					"children": [{
						"type": "textnode",
						"id": "textnode560923",
						"properties": {
							"x": 0,
							"y": 0,
							"name": "name",
							"sourceRef": "",
							"targetRef": "",
							"text": "任务2"
						},
						"children": []
					}]
				},
				{
					"type": "endevent",
					"id": "endevent598210",
					"properties": {
						"x": 799,
						"y": 284,
						"name": "结束",
						"sourceRef": "usertask97798",
						"targetRef": ""
					},
					"children": []
				},
				{
					"type": "sequenceflow",
					"id": "sequenceflow42103",
					"properties": {
						"x": 0,
						"y": 0,
						"name": "",
						"sourceRef": "startevent159438",
						"targetRef": "usertask716081",
						"path": "M288,386.18934911242604 L373,358.5266272189349"
					},
					"children": [{
						"type": "arrownode",
						"id": "arrownode858890",
						"properties": {
							"x": 0,
							"y": 0,
							"name": "",
							"sourceRef": "",
							"targetRef": "",
							"path": "M373,358.5266272189349 L364.5281408247329,356.7300743768391 L367.2082100118704,364.9651960609526z"
						},
						"children": []
					}]
				},
				{
					"type": "sequenceflow",
					"id": "sequenceflow228918",
					"properties": {
						"x": 0,
						"y": 0,
						"name": "",
						"sourceRef": "usertask716081",
						"targetRef": "usertask97798",
						"path": "M455.48201438848923,314 L535.5179856115108,225"
					},
					"children": [{
						"type": "arrownode",
						"id": "arrownode82031",
						"properties": {
							"x": 0,
							"y": 0,
							"name": "",
							"sourceRef": "",
							"targetRef": "",
							"path": "M535.5179856115108,225 L527.2832575222734,227.68127829520284 L533.7226766851536,233.47212286613825z"
						},
						"children": []
					}]
				},
				{
					"type": "sequenceflow",
					"id": "sequenceflow73665",
					"properties": {
						"x": 0,
						"y": 0,
						"name": "",
						"sourceRef": "usertask97798",
						"targetRef": "endevent598210",
						"path": "M618,224.45283018867926 L799,298.2188679245283"
					},
					"children": [{
						"type": "arrownode",
						"id": "arrownode260053",
						"properties": {
							"x": 0,
							"y": 0,
							"name": "",
							"sourceRef": "",
							"targetRef": "",
							"path": "M799,298.2188679245283 L793.6888706136956,291.37840707441495 L790.4204224370567,299.3982104707973z"
						},
						"children": []
					}]
				}]
			}
		}),
		this.trigger("appLoaded")
	},
	_newAppFromObject: function(a, b) {
		var d = new AppControl;
		return d.initFromSerialized(b), d
	},
	_addControlFromObject: function(a){
		var b = ControlFactory.newControl(a.type), c, d;
		if(!b){
			console.error("unable to construct control of type: ", a.type);
			return;
		}

		this._bindAddControlEvents(b);

		for(var i = 0; i < a.children.length; i++){
			c = a.children[i],
			d = ControlFactory.newControl(c.type),
			d.initFromSerialized(c),
			b.addChild(d)
		}
		
		b.initFromSerialized(a),
		b.setAlreadyAfterBound(!0),
		a.type === "sequenceflow" ? this._addPath(b) : this._addControl(b)
	},
	openFromObject: function(a){
		console.log("BUILDER: new app");
		var d = a.doc; // app node
		if (!d) {
			Utils.alert("Unable to load app.");
			return
		}

		this._document.root = this._newAppFromObject(d.id, d);
		
		for (var e = 0; e < d.children.length; e++) {			
			this._addControlFromObject(d.children[e])
		}
	},
	getSitePath: function() {
		if(!this._sitePath){
			var a = window.document.location.pathname, b = a.substring(0, a.substr(1).indexOf('/') + 2);
			this._sitePath = (b == "/flowbuilder/" ? "/" : b);
		}
		return this._sitePath
	},
	onDropActivate: function(a, b){
		console.log("drop activate")
	},
	onDropDeactivate: function(a, b){
		console.log("drop deactivate")
		this.onDropFinished()
	},
	onDropOver: function(a, b){
		console.log("drop over")
		var c = $(b.draggable).attr("type");
		this._dragDropTarget = c
	},
	onDropOut: function(a, b){
		console.log("drop out")
		this._dragDropTarget = null
	},
	onDrop: function(a, b){
		console.log("drop")
		if(!this._dragDropTarget) return;
		this.addControl(this._dragDropTarget, [a.pageX, a.pageY - 40]),
		this.onDropFinished()
	},
	onDropTargetMouseMove: function(a){
		if(!this._dragDropTarget) return;
		console.log("drop target mousemove")
	},
	onDropFinished: function(){
		this._dragDropTarget = null
	}
});



