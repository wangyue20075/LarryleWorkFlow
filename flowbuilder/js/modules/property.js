
Property = Backbone.View.extend({

	initialize: function(title, widget, value) {
		this._title = title,
		this.value = value,
		this._widget = widget,
		widget.setValue(this.value),
		this._defaultData = {
			value: this.value,
			_property_title: title
		}
	},
	setValue: function(a, b) {
		this.value = a,
		this._widget.setValue(a)
	},
	updateValue: function(a) {
		this.value = a,
		this._widget.updateValue(a)
	},
	getDefaultValue: function() {
		return this._defaultData.value
	},
	getValue: function() {
		return this.value
	},
	serialize: function() {
		var a = this._serializeProperty(this.value);
		return a
	},
	_serializeProperty: function(a) {
		if (typeof a == "object") {
			var b = {};
			for (var c in a) {
				var d = a[c];
				b[c] = this._serializeProperty(d)
			}
			return b
		}
		return a
	},
	render: function() {
		this.renderWidget()
	},
	renderWidget: function() {
		this._widget.render(this._defaultData._property_title)
	},
	getRenderedWidget: function() {
		return this._widget.el
	},
	bindWidgetEvent: function(a, b) {
		this._widget.bind(a, b, this)
	},
	getName: function() {
		return this._title
	},
	setName: function(a) {
		this._title = a,
		this._defaultData._property_title = a
	},
	getWidget: function() {
		return this._widget
	},
	handle: function(a) {}
});

ScalarProperty = Property.extend({
	initialize: function(a, b, c) {
		Property.prototype.initialize.call(this, a, b, c);
		var self = this;
		this.bindWidgetEvent("valueChanged", function(newValue) {
			console.log("PROPERTY: value changed ", self.getName(), self.getValue(), newValue);
			var oldValue = self.getValue();
			if (oldValue == newValue) return;
			self.updateValue(newValue),
			self.trigger("valueChanged", newValue),
			self.trigger("propertyChanged", self, oldValue, newValue)
		})
	}
});


