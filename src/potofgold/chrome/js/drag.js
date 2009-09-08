var map = [];
var dbg = function(t) {
	if (t instanceof Array) {
		for (var i = 0; i < t.length; i++) {
			dbg("t[" + i + "]=" + t[i]);
		}
	} else if (t instanceof Object) {
		for (var a in t) {
			dbg("t." + a + "=" + t[a]);
		}
	} else {
		if (debug.value == "")
			debug.value = t;
		else
			debug.value = t + "\n" + debug.value;
	}
}

function init() {
	window.debug = document.getElementById("debug");
	// dbg("hello");
}

window.addEventListener("load", init, true);

var listObserver = {
	onDragStart : function(event, transferData, action) {
		var txt = event.target.value;
		transferData.data = new TransferData();
		transferData.data.addDataForFlavour("text/unicode", txt);
	}
};

var boardObserver = {
	getSupportedFlavours : function() {
		var flavours = new FlavourSet();
		flavours.appendFlavour("text/unicode");
		return flavours;
	},

	onDragOver : function(event, flavour, session) {
	},
	// drop d'un label sur un #n
	onDrop : function(event, dropdata, session) {
		try {
			if (dropdata.data != "") {
				var import_list_fields = document
						.getElementById("import_list_fields");
				for (var i = 0; i < import_list_fields.childNodes.length; i++) {
					var source = import_list_fields.childNodes.item(i);
					if (source.value == dropdata.data) {
						source.style.display = 'none';
					}
				}

				var doc = event.currentTarget.parentNode.parentNode;
				var fields = doc.getElementsByClassName("field");

				var idx = parseInt(event.currentTarget.value.substring(1)) - 1;
				map[idx] = dropdata.data.substring(0, dropdata.data.length - 1);
				dbg("add=" + (idx));
				event.currentTarget.value2 = event.currentTarget.value;
				event.currentTarget.value = dropdata.data;
				for (var i = 0; i < fields.length; i++) {
					if (fields[i].value2 && fields[i] != event.target
							&& fields[i].value == dropdata.data) {
						var idx = parseInt(fields[i].value2.substring(1)) - 1;
						// map.splice()
						map[idx] = undefined;
						// map.splice(idx,1);
						dbg("splice=" + (idx));
						// map[idx] = null;
						fields[i].value = fields[i].value2;
					}
				}
				dbg(map);
			}
		} catch (e) {
			dbg(e);
		}
	}
};

var listObserver2 = {
	onDragStart : function(event, transferData, action) {
		var txt = event.target.value;
		transferData.data = new TransferData();
		transferData.data.addDataForFlavour("text/unicode", txt);
	}
};

var boardObserver2 = {
	getSupportedFlavours : function() {
		var flavours = new FlavourSet();
		flavours.appendFlavour("text/unicode");
		return flavours;
	},

	onDragOver : function(event, flavour, session) {
	},

	onDrop : function(event, dropdata, session) {
		try {
			if (dropdata.data != "" && dropdata.data.indexOf(":") != -1) {
				var labels = event.currentTarget.childNodes;
				for (var i = 0; i < labels.length; i++) {
					if (labels.item(i).value
							&& labels.item(i).value == dropdata.data) {
						labels.item(i).style.display = '';
					}
				}
				var doc = event.currentTarget.parentNode.parentNode;
				var fields = doc.getElementsByClassName("field");
				// dbg("doc.documentElement.nodeName="+doc.documentElement.nodeName);
				dbg("fields.length=" + fields.length);
				for (var i = 0; i < fields.length; i++) {
					if (dropdata.data == fields[i].value) {
						var idx = parseInt(fields[i].value2.substring(1)) - 1;
						// map.splice()
						map[idx] = undefined;
						// map.splice(idx,1);
						dbg("splice=" + (idx));
						// map[idx] = null;
						fields[i].value = fields[i].value2;
					}
				}
				dbg(map);
			}
		} catch (e) {
			dbg(e);
		}
	}
};
