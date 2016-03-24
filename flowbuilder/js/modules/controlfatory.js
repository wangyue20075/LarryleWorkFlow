ControlFactory = Backbone.Model.extend({}, {
    _controlMap: {
        startevent: StartEvent,
        endevent: EndEvent,
		usertask: UserTask,
		sequenceflow: SequenceFlow,
        textnode: TextNode,
        arrownode: ArrowNode
    },
    cloneControl: function (a) {
        var b = this.newControl(a.controlType);
        return b
    },
    getControlForType: function (a) {
        var b = this._controlMap[a];
        return b ? b : null
    },
	 /**
     * 实例化控制器
     * a, 是控件类型ID
	 * b, 额外的参数，用于传递到具体控件的初始化方法中
     */
    newControl: function (a, b) {
        var c = this._controlMap[a];
        return c ? new c(b) : (console.error("ControlFactory: unable to construct control of type: " + a), null)
    }
}),
ControlOutputVisitor = Backbone.Model.extend({
    getAppDocument: function (a) {
        return this.getOutputDict(a)
    },
    getOutputDict: function (a) {
        var b = a.getChildrens(),
            c = [];
        for (var d = 0; d < b.length; d++) {
            var e = b[d],
                f = this.getOutputDict(e);
            c.push(f)
        }
        return {
			type: a.getControlType(),
            id: a.getId(),          
			properties: a.getSerializedProperties(),
            children: c           
        }
    }
});