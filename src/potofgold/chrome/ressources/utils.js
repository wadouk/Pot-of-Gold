Components.utils.import("resource://m/debug.js");

var EXPORTED_SYMBOLS = ["prompts", "confirm2", "mainSB", "getContents",
		"Prefs", "currency", "getDS", "evalXPath", "getDSLocation", "split",
		"hasAmount", "formatCurrency"];

var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);

function getDS(doc) {
	return evalXPath("//*[@datasources]", doc);
}

function hasAmount(myRootNode) {
	// dump2("formatage de "+nodeToFormat.id);
	return evalXPath(".//*[@class='amount']", myRootNode);
}

function formatCurrency(nl) {
	var cpt = 0;
	try {
		// dump2("format de " + nl.length + " pour <" + myRootNode.nodeName
		// + (myRootNode.id ? "id=" + myRootNode.id : "") + ">");
		cpt = nl.length;
		if (nl.length == 0)
			dump2("Impossible de formater, aucun amount");
		for (var i = 0; i < nl.length; i++) {
			if (nl[i].nodeName != "treecol") {
				var attr = "";
				if (nl[i].nodeName == "treecell")
					attr = "label";
				else
					attr = "value";
				var oldval = nl[i].getAttribute(attr);
				var newval = currency(oldval);
				if (oldval == newval)
					cpt--;
				nl[i].setAttribute(attr, newval);
			}
		}
	} catch (e) {
		dump2(e);
	}
	// dump2("format de " + cpt + " pour <" + myRootNode.nodeName
	// + (myRootNode.id ? "id=" + myRootNode.id : "") + ">");

}

function split(str, sep) {
	var ar = str.split(sep);
	if (ar && ar.length == 1 && ar[0] == "")
		return [];
	else
		return ar;
}

function confirm2(msg, parent, title) {
	var confirm = prompts.confirm(parent, title, msg);
	dump2("confirm=");
	dump2(confirm);
	return confirm;
}

function evalXPath(expression, rootNode) {
	try {
		var xpathIterator = rootNode.ownerDocument.evaluate(expression,
				rootNode, null, // no namespace resolver
				5, null); // no existing
		// 5 = ORDERED_NODE_ITERATOR_TYPE
		// results
	} catch (err) {
		dump2(err);
		return null;
	}
	var results = [];

	// Convert result to JS array
	for (var xpathNode = xpathIterator.iterateNext(); xpathNode; xpathNode = xpathIterator
			.iterateNext()) {
		results.push(xpathNode);
	}
	return results;
}

function getDSLocation() {
	var type = Prefs.getDbLocType();
	var ds = Prefs.getDbLocPath();
	switch (type) {
		case 1 :
			ds = "profile:" + ds;
			break;
		case 0 :
			ds = "chrome://db/content/" + ds;
	}
	return ds;
}

function currency(anynum) {
	// -- Returns passed number as string in $xxx,xxx.xx format.
	// anynum=eval(anynum);
	// var workNum=Math.abs((Math.round(anynum*100)/100));
	var workStr = "" + anynum;
	if (anynum.match(/^-{0,1}\d+(\.\d+){0,}$/g)) {
		if (workStr.indexOf(".") == -1) {
			workStr += ",00";
		} else {
			workStr = workStr.replace(".", ",");
		}
		var dStr = workStr.substr(0, workStr.indexOf(","));
		var dNum = dStr - 0;
		var pStr = workStr.substr(workStr.indexOf(","));
		while (pStr.length < 3) {
			pStr += "0";
		}

		// --- Adds comma in thousands place.
		if (dNum >= 1000) {
			var dLen = dStr.length;
			dStr = parseInt("" + (dNum / 1000)) + " "
					+ dStr.substring(dLen - 3, dLen);
		}

		// -- Adds comma in millions place.
		if (dNum >= 1000000) {
			var dLen = dStr.length;
			dStr = parseInt("" + (dNum / 1000000)) + " "
					+ dStr.substring(dLen - 7, dLen);
		}
		var retval = dStr + pStr;
		// -- Put numbers in parentheses if negative.
		if (anynum < 0) {
			retval = "(" + retval.substring(1) + ")";
		}
		var currencyUnit = Prefs.get("extensions.potofgold.currencyUnit");
		return retval + " " + String.fromCharCode(currencyUnit);
		// return retval + " " + currencyUnit;
	} else {
		// dump2(anynum + " d�j� format�");
		return anynum;
	}
}

var mainSB = {
	_bundle : Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle("chrome://potofgold/locale/main.properties"),

	getProps : function(url) {
		return Components.classes["@mozilla.org/intl/stringbundle;1"]
				.getService(Components.interfaces.nsIStringBundleService)
				.createBundle(url);
	},

	getString : function(msg, args) { // get localised message
		if (args) {
			args = Array.prototype.slice.call(arguments, 1);
			return this._bundle.formatStringFromName(msg, args, args.length);
		} else {
			try {
				return this._bundle.GetStringFromName(msg);
			} catch (e) {
				throw new Error("La stringbundle " + msg
						+ (args ? " avec les arguments " + args : "")
						+ " est introuvable ");
			}
		}
	}
};

function getContents(aURL) {
	var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
	var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
			.getService(Components.interfaces.nsIScriptableInputStream);

	var channel = ioService.newChannel(aURL, null, null);
	var input = channel.open();
	scriptableStream.init(input);
	var str = scriptableStream.read(input.available());
	scriptableStream.close();
	input.close();
	return str;
}

const DBLOC_TYPE = "extensions.potofgold.dbloc.type";
const DBLOC_PATH = "extensions.potofgold.dbloc.path";
const IMPORT_MAP = "extensions.potofgold.import.map";

var Prefs = {

	_pref : Components.classes['@mozilla.org/preferences-service;1']
			.getService(Components.interfaces.nsIPrefBranch),
	get : function(key) {
		var val;
		switch (this._pref.getPrefType(key)) {
			case 32 :
				val = this._pref.getCharPref(key);
				if (val.indexOf("chrome://") == 0) {
					// la chaine commence par une URL chrome
					// on charge cette URL
					val = mainSB.getProps(val);
					val = val.GetStringFromName(key);
					return val;
				}
				break;
			case 64 :
				val = this._pref.getIntPref(key);
				break;
			case 128 :
				val = this._pref.getBoolPref(key);
				break;
			default :
				throw new Error("Type " + (this._pref.getPrefType(key))
						+ " non connu (" + key + ")");
				break;
		}
		return val;
	},
	set : function(key, val) {
		// var val;
		if (val instanceof Boolean) {
			this._pref.setBoolPref(key, val);
		} else if (val instanceof Number) {
			this._pref.setIntPref(key, val);
		} else if (val instanceof String) {
			this._pref.setCharPref(key, val);
		} else {
			this._pref.setCharPref(key, "" + val);
			// throw new Error("Set Type "+(this._pref.getPrefType(key))+" non
			// connu ("+key+")");
		}
	},

	getDbLocType : function() {
		return this.get(DBLOC_TYPE);
	},

	getDbLocPath : function() {
		return this.get(DBLOC_PATH);
	},
	getImportMap : function() {
		return this.get(IMPORT_MAP);
	},
	setImportMap : function(map) {
		return this.set(IMPORT_MAP, map);
	}
};

/*
 * function include(path) { var loader =
 * Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
 * .getService(Components.interfaces.mozIJSSubScriptLoader);
 * 
 * loader.loadSubScript(path); }
 */