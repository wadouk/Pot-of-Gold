Components.utils.import("resource://app/modules/debug.js");
Components.utils.import("resource://app/modules/utils.js");
Components.utils.import("resource://app/modules/Db.js");
// var setCellText;
var treeOther;
function editListener(event) {

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
			// dump2("match=" + (event.prevValue) + "* " + r);
			if (event.newValue == treeOther.view.getCellText(
					treeOther.editingRow, treeOther.editingColumn)) {
				dump2("**editListener");
				var dbcol = treeOther.editingColumn.id.split("_")[1];
				// dump2("parentNode="+(event.relatedNode.parentNode == null));
				// dump2("parentNode="+event.relatedNode.parentNode);
				// dumpNode(event.relatedNode);
				// dump2("attrName=" + event.attrName);
				// dump2("attrChange=" + event.attrChange);
				// dump2("event.prevValue=" + event.newValue);
				// dump2("event.newValue=" + event.prevValue);
				// dump2("editingRow=" + treeOther.editingRow);
				// dump2("editingColumn=" + treeOther.editingColumn.id);
				var row = treeOther.editingRow;
				var expectedChanges = treeOther.view.getCellText(row,
						treeOther.columns[4]);
				var other;
				if (dbcol == "other") {
					other = event.prevValue;
				} else {
					other = treeOther.view.getCellText(row,
							treeOther.columns[0]);
				}
				// if (other == "") {
				// other = "null";
				// } else {
				// other = "'" + other + "'";
				// }
				var upd = new Upd();
				upd.table = "operations";
				var categ = treeOther.view.getCellText(row,
						treeOther.columns[1]);
				// dump2(other + "," + col + "," + value);
				var newValue = event.newValue;
				// if (newValue == "") {
				// newValue = "null"
				// } else {
				// newValue = "'" + newValue + "'";
				// }

				upd.newVals[dbcol] = newValue;
				upd.oldVals["other"] = other;
				var request = "update operations set " + dbcol + " = "
						+ newValue + " where other=" + other + " ";
				if (dbcol != "other") {
					upd.oldVals[dbcol] = event.prevValue;
					// if (event.prevValue == "") {
					// request += " and " + dbcol + " is null";
					// } else {
					// request += " and " + dbcol + " = '" + event.prevValue
					// + "'";
					// }
				}
				myDb.execByOther(upd, expectedChanges);
				// var statement;
				// dump2(request);
				// try {
				// statement = myDb.mDBConn.createStatement(request);
				// myDb.mDBConn.beginTransaction();
				// statement.execute();
				// myDb.check(expectedChanges);
				// myDb.mDBConn.commitTransaction();
				// } catch (e) {
				// if (myDb.mDBConn.transactionInProgress)
				// myDb.mDBConn.rollbackTransaction();
				// dump2("lastErrorString=" + myDb.mDBConn.lastErrorString);
				// throw e;
				// }
				// treeOther.builder.rebuild();
				init();
				// } else {
				// dump2("match");
			}
		}
	} catch (e) {
		dump2(e);
	}
}

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
			treeOther = document.getElementById("tree_other");
			treeOther.addEventListener("DOMAttrModified", editListener, true);
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