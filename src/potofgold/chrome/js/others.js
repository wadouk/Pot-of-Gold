Components.utils.import("resource://m/debug.js");
Components.utils.import("resource://m/utils.js");
Components.utils.import("resource://m/Db.js");
// var setCellText;
var treeOther;
function editListener(event) {
	// dump2("event.relatedNode="+event.relatedNode.nodeName);

	// if (treeOther.editingRow != -1) {
	// dump2("**editListener");
	// dump2("attrName=" + event.attrName);
	// dump2("attrChange=" + event.attrChange);
	// dump2("event.prevValue=" + event.newValue);
	// dump2("event.newValue=" + event.prevValue);
	// dump2("editingRow=" + treeOther.editingRow);
	// dump2("editingColumn=" + treeOther.editingColumn.id);
	// }
	try {
		if (treeOther.editingRow != -1 && event.attrName == "label") {
			var dbcol = treeOther.editingColumn.id.split("_")[1];
			var row = treeOther.editingRow;
			var expectedChanges = treeOther.view.getCellText(row,
					treeOther.columns[4]);
			var other;
			if (dbcol == "other") {
				other = event.prevValue;
			} else {
				other = treeOther.view.getCellText(row, treeOther.columns[0]);
			}
			if (other == "") {
				other = "null";
			} else {
				other = "'" + other + "'";
			}
			var categ = treeOther.view.getCellText(row, treeOther.columns[1]);
			// dump2(other + "," + col + "," + value);
			var newValue = event.newValue;
			if (newValue == "") {
				newValue = "null"
			} else {
				newValue = "'" + newValue + "'";
			}
			var request = "update operations set " + dbcol + " = " + newValue
					+ " where other=" + other + " ";
			if (dbcol != "other") {
				if (event.prevValue == "") {
					request += " and " + dbcol + " is null";
				} else {
					request += " and " + dbcol + " = '" + event.prevValue + "'";
				}
			}

			var statement;
			dump2(request);
			try {
				statement = myDb.mDBConn.createStatement(request);
				myDb.mDBConn.beginTransaction();
				statement.execute();
				myDb.check(expectedChanges, true);
				myDb.mDBConn.commitTransaction();
			} catch (e) {
				if (myDb.mDBConn.transactionInProgress)
					myDb.mDBConn.rollbackTransaction();
				dump2("lastErrorString=" + myDb.mDBConn.lastErrorString);
				throw e;
			}
			treeOther.builder.rebuild();
		}
	} catch (e) {
		dump2(e);
	}
}

var someBuildListener = {
	willRebuild : function(builder) {
	},
	didRebuild : function(builder) {
		addEditListener();
	}
}

function init() {
	try {
		var list = getDS(document.firstChild);
		var ds = getDSLocation();
		treeOther = document.getElementById("tree_other");

		// dump2("startEditing");
		// dump2(treeOther.startEditing);
		//
		// dump2("stopEditing");
		// dump2(treeOther.stopEditing);

		treeOther.addEventListener("DOMAttrModified", editListener, true);
		// treeOther.builder.addListener(someBuildListener);
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