Components.utils.import("resource://m/debug.js");
Components.utils.import("resource://m/utils.js");
Components.utils.import("resource://m/Db.js");
// var setCellText;
var treeOther;
function addEditListener() {
	treeOther.view.setCellText = function(row, col, value) {
		var dbcol = col.id.split("_")[1];
		var expectedChanges = treeOther.view.getCellText(row,
				treeOther.columns[4]);
		var other = treeOther.view.getCellText(row, treeOther.columns[0]);
		var categ = treeOther.view.getCellText(row, treeOther.columns[1]);
		dump2(other + "," + col + "," + value);

		var request = "update operations set " + dbcol + " = '" + value
				+ "' where other='" + other + "'";
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
		treeOther.builder.addListener(someBuildListener);
		for (var i = 0; i < list.length; i++) {
			if (list[i].datasources != ds)
				list[i].datasources = ds;
			//list[i].builder
			list[i].builder.rebuild();
		}
	} catch (e) {
		dump2(e);
	}
}


window.addEventListener("load", init, true);