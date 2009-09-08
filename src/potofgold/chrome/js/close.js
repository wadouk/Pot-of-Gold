Components.utils.import("resource://m/debug.js");
Components.utils.import("resource://m/utils.js");
Components.utils.import("resource://m/Db2.js");

var queries = {
	"closed_more" : {
		sql : "select total(amount)/100 as stat from vw_oper where state = 3 and amount > 0"
	},
	"closed_less" : {
		sql : "select total(amount)/100 as stat from vw_oper where state = 3 and amount < 0"
	},
	"last_closed" : {
		sql : "select max(v.date) as stat from vw_oper v where state=3"
	},
	"amount_closed" : {
		sql : "select total(amount)/100 as stat from vw_oper where state = 4"
	},
	"amount_closedorchecked" : {
		sql : "select total(amount)/100 as stat from vw_oper where state in (4,3)"
	}
};

var timer;

function closeThose() {
	var sql_nbclosed = "select count(*) from operations where closed is null and checked is not null";
	var nbclosed, st_nbclosed, st_query;

	try {
		//st_nbclosed = window.opener.myDb.mDBConn.createStatement(sql_nbclosed);
		st_nbclosed = myDb.mDBConn.createStatement(sql_nbclosed);
		if (st_nbclosed.executeStep()) {
			nbclosed = st_nbclosed.getInt64(0);
			if (st_nbclosed)
				st_nbclosed.reset();
			dump2("nbclosed=" + nbclosed);
			if (nbclosed != 0) {
				//var now = window.opener.myDb.now();
				var now = myDb.now();
				var query = "update operations set closed = '" + now
						+ "' where checked is not null and closed is null";
				//st_query = window.opener.myDb.mDBConn.createStatement(query);
						st_query = myDb.mDBConn.createStatement(query);

				//window.opener.myDb.mDBConn.beginTransaction();
						myDb.mDBConn.beginTransaction();
				st_query.execute();
				//window.opener.myDb.check(nbclosed);
				myDb.check(nbclosed);
				myDb.mDBConn.commitTransaction();
				//window.opener.myDb.mDBConn.commitTransaction();
				window.opener.addDS();
			} else {
				dump2(mainSB.getString("nothing_to_close"));
			}
		}
		return true;
	} catch (e) {
		dump2(e);
		//dump2("lastErrorString=" + window.opener.myDb.mDBConn.lastErrorString);
		dump2("lastErrorString=" + myDb.mDBConn.lastErrorString);
		//if (window.opener.myDb.mDBConn.transactionInProgress)
		//	window.opener.myDb.mDBConn.rollbackTransaction();
		if (myDb.mDBConn.transactionInProgress)
			myDb.mDBConn.rollbackTransaction();
		throw e;
	}
	return false;
}

function init() {
	for (var queryname in queries) {
		var query = queries[queryname].sql;
		dump2("sql[" + queryname + "]=" + query);
		//var statement = window.opener.myDb.mDBConn.createStatement(query);
		var statement = myDb.mDBConn.createStatement(query);
		if (statement.executeStep()) {
			var el = document.getElementById(queryname);
			if (el.getAttribute("class").indexOf("amount") != -1) {
				var value = statement.getDouble(0);
				queries[queryname].result = value;
				value = currency(new String(value));
			} else {
				var value = statement.getString(0);
				queries[queryname].result = value;
			}
			if (queryname == "last_closed" && value == 0) {
				value = mainSB.getString("never");
			}
			dump2("queries[" + queryname + "].result="
					+ queries[queryname].result);
			el.setAttribute("value", value);

		}
		statement.reset();
	}
	computeDiff();
}

var keypress = function() {
	if (timer && timer != null)
		clearTimeout(timer);
	timer = setTimeout(computeDiff, 1000);
}

var computeDiff = function() {
	dump2("computeDiff");
	var amount_closedorchecked = queries["amount_closedorchecked"].result;
	dump2("amount_closedorchecked=" + amount_closedorchecked);
	var bank_amount = document.getElementById("bank_amount").value;
	var diff = document.getElementById("diff");
	var curDiff = bank_amount - amount_closedorchecked;
	dump2(bank_amount + "-" + amount_closedorchecked + "=" + curDiff);
	diff.setAttribute("value", currency(new String(curDiff)));
	if (curDiff == 0) {
		document.documentElement.getButton("accept").disabled = false;
	} else {
		document.documentElement.getButton("accept").disabled = true;
	}
}
/**/
window.addEventListener("load", init, true);
