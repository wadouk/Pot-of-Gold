Components.utils.import("resource://app/modules/debug.js");
Components.utils.import("resource://app/modules/utils.js");
Components.utils.import("resource://app/modules/Db.js");
// var setCellText;
var treeOther;

var someBuildListener = {
	willRebuild : function(builder) {
	},
	didRebuild : function(builder) {

		var nlAmount = hasAmount(builder.root);
		if (nlAmount.length != 0)
			formatCurrency(nlAmount);

	}
}

function init(event) {
	try {
		// dump2(event);
		var list = getDS(document.firstChild);
		var ds = getDSLocation();
		dump2("list.length=" + list.length);
		// dump2("startEditing");
		// dump2(treeOther.startEditing);
		//
		// dump2("stopEditing");
		// dump2(treeOther.stopEditing);

		if (event) {
			dump2("event listener sur tree");
			treeOther = document.getElementById("tree_categ");
			//treeOther.addEventListener("DOMAttrModified", editListener, true);
			treeOther.builder.addListener(someBuildListener);
		}
		for (var i = 0; i < list.length; i++) {
			if (list[i].datasources != ds)
				list[i].datasources = ds;
			// list[i].builder
			list[i].builder.rebuild();
		}

	} catch (e) {
		dump2(e);
	}
}

window.addEventListener("load", init, true);
