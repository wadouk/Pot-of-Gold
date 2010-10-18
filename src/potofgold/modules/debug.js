var EXPORTED_SYMBOLS = ["dump2", "getTypeOf", "log", "dumpNode"];

function getTypeOf(obj) {

	/*
	 * for (var i=0;i<all.length;i++) { dump2("++el["+i+"]"); dump2("el["+i+"]
	 * typeof="+(typeof(all[i]))); dump2("el["+i+"] inst obj="+(all[i]
	 * instanceof Object)); dump2("el["+i+"] inst arr="+(all[i] instanceof
	 * Array)); if (all[i].constructor && all[i].constructor.name)
	 * dump2((all[i].constructor.name == null ? "const name null" :
	 * (all[i].constructor.name == "" ? "const name vide": "el["+i+"] const
	 * name="+(all[i].constructor.name)) )); else dump2("const undefined ou
	 * unnamed"); if (Node) dump2("el["+i+"] ins n"+(all[i] instanceof Node)); }
	 */
	var type;
	if (!obj)
		type = "undefined";
	else if (obj == null)
		type = "null";
	else if (obj.constructor && obj.constructor.name
			&& obj.constructor.name != "" && obj.constructor.name != null) {
		type = obj.constructor.name;
	} else {
		try {
			if (obj instanceof Node)
				type = "Node";
			else
				type = "unknown";
		} catch (e) {
			type = typeof(obj);
		}
	}
	return type.toLowerCase();
}

function dumpNode(e) {
	switch (e.nodeType) {
		case 2 : // attr
			dump2(" " + e.nodeName + "=\"" + e.nodeValue + "\"");
			break;
		case 1 :
			dump2("<" + e.nodeName);
			if (e.nodeType == 1) {
				for (var i = 0; i < e.attributes.length; i++) {
					dumpNode(e.attributes.item(i));
				}
			}
			if (e.nodeType == 1) {
				dump2(">");
			}
			if (e.hasChildNodes && e.hasChildNodes()) {
				for (var i = 0; i < e.childNodes.length; i++) {
					dumpNode(e.childNodes[i]);
				}
			}
			dump2("</" + e.nodeName + ">");
			break;
		case 3 :
			dump2(e.nodeValue);
			break;
	}
}

// dump("hello\n");
function dump2(e) {
	// log({msg:"--"});
	var dumpMore = true;
	switch (getTypeOf(e)) {
		case "array" :
			// log({msg:"array"+"\n"});
			for (var i = 0; i < e.length; i++) {
				log({
							msg : "t[" + i + "]=" + e[i] + "\n"
						});
			}
			break;
		case "object" :
			for (var a in e) {
				log({
							msg : "t." + a + "=" + e[a]
						});
				dumpMore = false;
			}
			break;
		default :
			log({
						msg : e
					});
			break;
	}
}

function log(args) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService);
	if (args.flag) {
		var scriptError = Components.classes["@mozilla.org/scripterror;1"]
				.createInstance(Components.interfaces.nsIScriptError);

		scriptError.init((args.msg ? args.msg : null), (args.src
						? args.src
						: null), (args.srcline ? args.srcline : null),
				(args.lineNum ? args.lineNum : null), (args.colNum
						? args.colNum
						: null), args.flag, (args.categ ? args.categ : null));
		consoleService.logMessage(scriptError);
	} else
		consoleService.logStringMessage(args.msg);
	// ump(args.msg);

}
