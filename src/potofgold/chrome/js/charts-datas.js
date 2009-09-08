Components.utils.import("resource://m/debug.js");
Components.utils.import("resource://m/utils.js");
Components.utils.import("resource://m/Db.js");

window.addEventListener("load", draw, true);

var aPoint = [];
var oSolde, oBalance;
var x = {};
var y = {};
var dx, dy, dmm, des;
const QMARGE = 0.02;
const MARGE_X = 50;
const MARGE_Y = 20;
const XMLNS_SVG = "http://www.w3.org/2000/svg";
const GAP_Y = 100000;
var svg, nX, nY, labels_x, labels_y, reperes_x, reperes_y;
var width, height;
var amount, date, point;

function fromDToX(D) {
	return Math.round((((D - oSolde.start) / des) * dx) + x.x1);
}
function fromXToD(X) {
	return new Date(((((X - x.x1) / dx) * des) + oSolde.start) * 1000);
}

function fromMToY(M) {
	return Math.round((((oSolde.max - M) / dmm) * dy) + y.y1);

}
function fromYToM(Y) {
	return currency(""
			+ (-Math.round(((Y + y.y1) / dy) * dmm - oSolde.max) / 100));
}
/*
 * function display(evt) { dump2("display"); var id = evt.target.id; id =
 * id[id.length - 1];
 * 
 * var labels = document.getElementById("labels_" + id);
 * 
 * if (labels.style.display == "") { labels.style.display = "none"; } else {
 * labels.style.display = ""; } }
 */
function dispCoords(evt) {
	// var evt = window.event;
	if (aPoint[evt.clientX]) {
		amount.setAttribute("cx", x.x1);
		amount.setAttribute("cy", aPoint[evt.clientX]);
		date.setAttribute("cx", evt.clientX);
		date.setAttribute("cy", y.y2);
		point.setAttribute("cx", evt.clientX);
		point.setAttribute("cy", aPoint[evt.clientX]);

		var amount2 = document.getElementById("amount2");
		var date2 = document.getElementById("date2");
		amount2.value = fromYToM(aPoint[evt.clientX]);
		var d = fromXToD(evt.clientX);
		date2.value = d.getFullYear() + "-" + (d.getMonth() + 1) + "-"
				+ d.getDate();
	}
}

function drawRepereX0() {
	x.x1 = MARGE_X;
	x.y1 = height - MARGE_Y;
	x.x2 = width;
	x.y2 = height - MARGE_Y;
	nX.setAttribute("x1", x.x1);
	nX.setAttribute("y1", x.y1);
	nX.setAttribute("x2", x.x2);
	nX.setAttribute("y2", x.y2);
}
function drawRepereY0() {
	y.x1 = MARGE_X;
	y.y1 = 0;
	y.x2 = MARGE_X;
	y.y2 = height - MARGE_Y;
	nY.setAttribute("x1", y.x1);
	nY.setAttribute("y1", y.y1);
	nY.setAttribute("x2", y.x2);
	nY.setAttribute("y2", y.y2);
}
function drawLabelsXn(begin, rep0) {

	var next = new Date(begin.getTime());
	next.setMonth(next.getMonth() + 1);
	next.setDate(1);
	var rep1 = next.getTime() / 1000;
	rep1 = fromDToX(rep1);
	var t = document.createElementNS(XMLNS_SVG, "text");
	if (rep1 < x.x2) {
		t.textContent = (begin.getMonth() + 1) + "-" + (begin.getYear() - 100);
		t.setAttribute("y", y.y2 + 10);
		t.setAttribute("x", rep0);
	} else {
		t.textContent = "m-A";
		t.setAttribute("y", y.y2 - 2);
		t.setAttribute("x", rep0 - 10);
	}
	labels_x.appendChild(t);
}
function drawLabelsYn(lower) {
	var t = document.createElementNS(XMLNS_SVG, "text");
	if (lower + GAP_Y < oSolde.max) {
		t.textContent = lower / 100;
		t.setAttribute("y", fromMToY(lower));
		t.setAttribute("x", x.x1 - 2);
		t.setAttribute("text-anchor", "end");
	} else {
		t.textContent = String.fromCharCode(Prefs
				.get("extensions.potofgold.currencyUnit"));
		t.setAttribute("y", fromMToY(lower) + 10);
		t.setAttribute("x", x.x1 + 5);
	}
	labels_y.appendChild(t);
}

function drawRepereYn(lower) {

	var l = document.createElementNS(XMLNS_SVG, "line");
	l.setAttribute("x1", x.x1);
	l.setAttribute("x2", x.x2);
	l.setAttribute("y1", fromMToY(lower));
	l.setAttribute("y2", fromMToY(lower));
	reperes_y.appendChild(l);
}

function drawRepereXn(rep0) {
	var l = document.createElementNS(XMLNS_SVG, "line");
	l.setAttribute("x1", rep0);
	l.setAttribute("y1", 0);
	l.setAttribute("x2", rep0);
	l.setAttribute("y2", y.y2);
	reperes_x.appendChild(l);
}
function drawRepereLabelsX() {
	var begin = new Date(oSolde.start * 1000);

	while (begin.getTime() / 1000 < oSolde.end) {
		begin.setMonth(begin.getMonth() + 1);
		begin.setDate(1);
		var rep0 = begin.getTime() / 1000;
		rep0 = fromDToX(rep0);
		drawRepereXn(rep0);
		drawLabelsXn(begin, rep0);
	}
}
function drawRepereLabelsY() {
	var llower = GAP_Y - (oSolde.min % GAP_Y);
	var lower = oSolde.min + llower;
	while (lower < oSolde.max) {
		drawRepereYn(lower);
		drawLabelsYn(lower);
		lower = lower + GAP_Y;
	}
}

function initVars() {
	svg = document.getElementById("svg");
	width = svg.getAttribute("width");
	width = new Number(width.substring(0, width.indexOf("px")));
	height = svg.getAttribute("height");
	height = new Number(height.substring(0, height.indexOf("px")));

	nX = document.getElementById("x");
	nY = document.getElementById("y");
	labels_x = document.getElementById("labels_x");
	labels_y = document.getElementById("labels_y");
	reperes_x = document.getElementById("reperes_x");
	reperes_y = document.getElementById("reperes_y");

	amount = document.getElementById("amount");
	date = document.getElementById("date");
	point = document.getElementById("point");
}

function drawReperes() {
	initVars();
	drawRepereX0();
	drawRepereY0();
	dx = x.x2 - x.x1;
	dy = y.y2 - y.y1;
	dmm = oSolde.max - oSolde.min;
	des = oSolde.end - oSolde.start;
	drawRepereLabelsX();
	drawRepereLabelsY()
	// dump2("dx=" + dx);
	// dump2("dy=" + dy);
	// dump2("dmm=" + dmm);
	// dump2("des=" + des);

	// dse
}

function draw() {
	getSoldeEval();
	drawReperes();
	convertToPointsXY();
	drawAVG();
}

function drawAVG() {
	var aAVG = [];

	// for ()
}

function convertToPointsXY() {
	var points = [];
	for (var i = 0; i < oSolde.points.length; i++) {
		oSolde.points[i].x = fromDToX(oSolde.points[i].milli);
		oSolde.points[i].y = fromMToY(oSolde.points[i].value);
		points.push(oSolde.points[i].x + "," + oSolde.points[i].y);
		aPoint[oSolde.points[i].x] = oSolde.points[i].y;

	}
	// dump2("aPoint=" + aPoint.length);
	var polyline = document.getElementById("oSolde");
	// dump2("points=" + points.join(" "));
	polyline.setAttribute("points", points.join(" "));
}

function getDebitByMonth() {

	var query = " select m, sum(amount) s " + " from ( "
			+ " select strftime('%Y-%m-10',date) as m, date, " + " amount "
			+ " from vw_oper " + " ) where amount < 0 " + " group by m ";
}

function getCreditByMonth() {
	var query = " select strftime(%s',m) milli, sum(amount) s " + " from ( "
			+ " select strftime('%Y-%m-05',date) as m, date, " + " amount "
			+ " from vw_oper " + " ) where amount > 0 " + " group by m ";
	var st = myDb.mDBConn.createStatement(query);
	while (st.executeStep()) {
		var m = st.row.milli;
		var s = st.row.s;
	}
}

function getBalance() {
	var query = "select *, strftime('%s',m) mm, p-n d from ( select m, sum(n) n, sum(p) p "
			+ " from ( select strftime('%Y-%m-01',date) as m, date, "
			+ " amount, case substr(amount,0,1) "
			+ " when '-' then abs(amount) else 0 end n, "
			+ " case substr(amount,0,1) when ''-' then 0 "
			+ " else amount end p from vw_oper ) group by m  ) ";

}

function getSoldeEval() {
	var query = "select strftime('%s',date) milli, date,sum(amount) as amount from vw_oper group by date order by date asc";
	var st = myDb.mDBConn.createStatement(query);
	oSolde = {};
	var solde = 0;

	oSolde.points = [];
	oSolde.first = true;
	oSolde.min = 0;
	oSolde.max = 0;
	oSolde.start = 0;
	oSolde.end = 0;
	while (st.executeStep()) {
		var date;
		var amount;
		var milli;
		for (var i = 0; i < st.columnCount; i++) {
			switch (st.getColumnName(i)) {
				case "date" :
					date = st.getString(i);
					break;
				case "amount" :
					amount = st.getInt64(i);
					break;
				case "milli" :
					milli = st.getInt64(i);
					break;
			}
		}
		solde = amount + solde;

		if (oSolde.first) {
			oSolde.first = false;
			oSolde.min = solde;
			oSolde.max = solde;
			oSolde.start = milli;
			var point0 = {
				milli : oSolde.start,
				value : oSolde.min,
				label : date
			};
			oSolde.points.push(point0);
		}
		if (oSolde.min > solde) {
			oSolde.min = solde;
		}
		if (oSolde.max < solde) {
			oSolde.max = solde;
		}

		var point = {};
		oSolde.end = milli;
		point.milli = milli;
		point.label = date;
		point.value = solde;
		oSolde.points.push(point);
	}
	var pointL = {
		milli : oSolde.end,
		value : oSolde.min,
		label : date
	};

	oSolde.points.push(pointL);
	// on augmente les extremes de QMARGE
	// pour que la courbe
	// ne soit pas collé aux repères
	var desQ = (oSolde.end - oSolde.start) * QMARGE;
	oSolde.end = oSolde.end + desQ;
	oSolde.start = oSolde.start - desQ;

	var dmmQ = (oSolde.max - oSolde.min) * QMARGE;
	oSolde.min = oSolde.min - dmmQ;
	oSolde.max = oSolde.max + dmmQ;

	oSolde.points[0].value = oSolde.min;
	oSolde.points[oSolde.points.length - 1].value = oSolde.min;

	// dump2("solde=" + solde);
	// dump2("oSolde=");
	// dump2(oSolde);
}