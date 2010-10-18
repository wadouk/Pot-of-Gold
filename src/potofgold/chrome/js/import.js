Components.utils.import("resource://app/modules/debug.js");
Components.utils.import("resource://app/modules/utils.js");
Components.utils.import("resource://app/modules/Db.js");

var import_file, nbLine, nbField, firstLine, lines;
var linesep, fieldsep;

function import_load() {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fileChooser = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(nsIFilePicker);
	fileChooser.appendFilter(mainSB.getString("import.filetype.csv"), "*.csv");
	fileChooser.appendFilter(mainSB.getString("import.filetype.xml"), "*.xml");
	fileChooser.appendFilter(mainSB.getString("import.filetype.ofx"), "*.ofx");
	fileChooser.init(window, mainSB.getString("import.selectFile"),
			nsIFilePicker.modeOpen);
	var fileBox = fileChooser.show();

	if (fileBox != 0) {
		dump2("Appui sur autre chose que OK, on ferme (fileBox = " + fileBox
				+ ")");
		window.close();
		return false;
	}

	import_file = fileChooser.file;
	var leafName = import_file.leafName;
	// dump2(leafName);
	var dotPos = leafName.lastIndexOf(".") + 1;
	var ext = leafName.substring(dotPos)
	ext = ext.toLowerCase();
	// dump2(ext);
	switch (ext) {
		case "csv" :
			// var t_import = document.getElementById("import");
			// dump2("importWin="+t_import.firstChild.nodeName);
			// if (t_import && t_import.setFile)
			// t_import.setFile(import_file);
			// else
			// dump2("pas d'accord");
			// addEventListener("load",import_load,true);

			break;
		default :
			alert("Non implémenté");
			break;
		/*
		 * case "xml": case "ofx":
		 */
	}

	dump2("import_load =" + import_file.leafName);
	document.getElementById("select_file").value = import_file.leafName;

	var charset = "";
	for (var i = 1; i < 6; i++) {
		charset += Prefs.get("intl.charsetmenu.browser.more" + i) + ", ";
	}
	charset += Prefs.get("intl.charsetmenu.browser.static") + ", ";
	charset += Prefs.get("intl.charsetmenu.browser.unicode");

	charset = charset.split(", ");
	charset = charset.sort();
	var alreadyMapped = {};
	var import_charset = document.getElementById("import_charset");
	var menuCharset = import_charset.firstChild;
	var listCharsets = menuCharset.childNodes;
	if (!listCharsets || listCharsets.length == 0) {
		var charset_persist;
		if (import_charset.hasAttribute("value")) {
			charset_persist = import_charset.getAttribute("value");
			dump2("has attribute =" + charset_persist);
		}

		for (var i = 0; i < listCharsets.length; i++) {
			menuCharset.removeChild(listCharsets.item(i));
		}
		for (var i = 0; i < charset.length; i++) {
			// permet de dédoublonner
			if (!alreadyMapped[charset[i]]) {
				var item_charset = import_charset.appendItem(charset[i],
						charset[i]);
				if (charset_persist && charset[i] == charset_persist) {

					import_charset.selectedItem = item_charset;
					// item_charset.setAttribute("selected","true");
				}
				/*
				 * var menuitem = document.createElement("menuitem");
				 * menuitem.setAttribute("label",charset[i]);
				 * menuCharset.appendChild(menuitem);
				 */
				alreadyMapped[charset[i]] = charset[i];
			}
		}
	}
	reparse_import();
}
function map_fields() {
	// dump2("hello3");
	try {
		document.getElementById("import-map-fields").datas = firstLine;
	} catch (e) {
		dump2(e);
	}
}

var warnLines;

function build_check() {
	try {
		var map = document.getElementById("import-map-fields").map;
		var myTree = document.getElementById("import-check-tree");
		Prefs.setImportMap(map);
		// dump("map=");
		dump2(map);
		var mapHead = {};
		for (var i = 0; i < map.length; i++) {
			if (map[i])
				mapHead[map[i]] = i;
		}
		dump2(mapHead);
		var treeContent = [];
		warnLines = [];
		for (var i = 0; i < lines.length; i++) {
			var temp1 = lines[i].split(fieldsep);
			treeContent[i] = temp1;
			if (temp1.length != nbField) {
				var raison = 0;
				var comment;
				if (lines[i].length == 0)
					raison = 1;
				warnLines.push({
							"raison" : raison,
							"rowNum" : (i + 1)
						});
			} else {
				var colDate = myTree.columns.getColumnAt(1).element
						.getAttribute("label");
				var valDate = treeContent[i][mapHead[colDate]];
				try {
					var reDate = /(\d{4})-(\d{2})-(\d{2})/g;
					var isDate = true;
					var matches = valDate.split("-");
					if (valDate.match(reDate) && matches.length == 3) {
						var d = new Number(matches[2]);
						var m = new Number(matches[1]) - 1;
						var y = new Number(matches[0]);
						var dateTest = new Date(y, m, d);
						if (dateTest.getDate() != d || dateTest.getMonth() != m
								|| dateTest.getFullYear() != y) {
							dump2("valDate=" + valDate + " " + dateTest);
							isDate = false;
						}
					}
				} catch (e) {
					isDate = false;
				}
				if (!isDate) {
					dump2("pas marché pour ligne " + (i + 1) + " " + valDate);
					warnLines.push({
								"raison" : 2,
								"rowNum" : (i + 1)
							});
				}

				var colMontant = myTree.columns.getColumnAt(5).element
						.getAttribute("label");
				var valMontant = treeContent[i][mapHead[colMontant]];

				var reMontant = /^-{0,1}\d+,\d{2}$/g;
				try {
					// var isMontant = ;
					if (!valMontant.match(reMontant)) {
						// dump2("marche pas " + valMontant + " " + isMontant);
						warnLines.push({
									"raison" : 3,
									"rowNum" : (i + 1)
								});
					}
				} catch (e) {
					dump2(e);
					warnLines.push({
								"raison" : 3,
								"rowNum" : (i + 1)
							});
				}

			}
		}

		var treeView = {
			rowCount : nbLine,
			getCellText : function(row, column) {
				try {
					if (column.id == "import-check-col-rowNum") {
						return row + 1;
					} else {
						var idxCol = mapHead[column.element
								.getAttribute("label")];
						if (idxCol && row < treeContent.length
								&& idxCol < treeContent[row].length) {
							var valToPrint = treeContent[row][idxCol];
							return valToPrint;
						} else {
							return "";
						}
					}
				} catch (e) {
					dump2(e);
				}
				return "";
			},
			setTree : function(treebox) {
				this.treebox = treebox;
			},
			isContainer : function(row) {
				return false;
			},
			isSeparator : function(row) {
				return false;
			},
			isSorted : function() {
				return false;
			},
			getLevel : function(row) {
				return 0;
			},
			getImageSrc : function(row, col) {
				return null;
			},
			getRowProperties : function(row, props) {
			},
			getCellProperties : function(row, col, props) {
			},
			getColumnProperties : function(colid, col, props) {
			}
		};

		// dump2("treeView.rowCount="+treeView.rowCount);
		myTree.view = treeView;
		if (warnLines.length != 0) {
			var import_warn = document.getElementById("import_warn");
			import_warn.style.display = '';
			var warn = [];
			for (var i = 0; i < warnLines.length; i++) {
				var addContent = true;
				comment = mainSB.getString("raison" + warnLines[i]["raison"]);
				switch (warnLines[i]["raison"]) {
					case 1 :
						addContent = false;
						break;
				}

				warn.push(mainSB.getString("ligne_foireuse",
						warnLines[i]["rowNum"], comment));
				if (addContent) {
					warn.push(mainSB.getString("contenu_ligne"));
					warn.push(lines[i]);
				}
			}
			import_warn.value = warn.join("\n");
		}
	} catch (e) {
		dump2(e);
	}
}

function put_in_db() {
	var myTree = document.getElementById("import-check-tree");
	var colDate = myTree.columns.getColumnAt(1);
	var colTiers = myTree.columns.getColumnAt(2);
	var colType = myTree.columns.getColumnAt(3);
	var colCateg = myTree.columns.getColumnAt(4);
	var colMontant = myTree.columns.getColumnAt(5);
	var colNum = myTree.columns.getColumnAt(6);

	//var curdb = new db();
	//myDb.mDBConn.beginTransaction();
	for (var i = 0; i < myTree.view.rowCount; i++) {
		// try {
		var to_import = true;
		for (var j = 0; j < warnLines.length; j++) {
			if (warnLines[j].rowNum == i + 1)
				to_import = false;
		}

		if (to_import) {
			var row = new Object();
			row.date = myTree.view.getCellText(i, colDate);
			row.other = myTree.view.getCellText(i, colTiers);
			row.categ = myTree.view.getCellText(i, colCateg);
			row.amount = myTree.view.getCellText(i, colMontant)
					.replace(',', '');
			row.num = myTree.view.getCellText(i, colNum);
			row.type = myTree.view.getCellText(i, colType);
			row.batch_num = import_file.leafName;
			curdb.exec(row, "operations");
		}

		// } catch (e) {
		// dump2("erreur lors de l'injection en base de la ligne " + (i+1));
		// dump2(e);
		// }
	}
	// curdb.mDBConn.rollbackTransaction();
	//curdb.mDBConn.commitTransaction();
	dump2("hello put in db");
		 } catch (e) {
		 dump2("erreur lors de l'injection en base");
		 dump2(e);
		 }
	
}

function reparse_import(event) {
	var charsets = {
		"n" : "\n",
		"r" : "\r",
		"rn" : "\r\n"
	};
	try {
		if (event != null) {
			// dump2(event.target);
		} else {
			// aucun évenement à l'origine
		}
		var import_linesep = document.getElementById("import_linesep");
		var import_fieldsep = document.getElementById("import_fieldsep");
		var import_charset = document.getElementById("import_charset");
		var import_ignore1stline = document
				.getElementById("import_ignore1stline");

		linesep = import_linesep.value;
		fieldsep = import_fieldsep.value;
		if (import_fieldsep.selectedIndex != -1)
			fieldsep = import_fieldsep.selectedItem.value;
		/*
		 * trick to try to persist the manual input of the field if
		 * (import_fieldsep.selectedIndex == -1 && fieldsep.length != 0) {
		 * import_fieldsep.appendItem(fieldsep,fieldsep);
		 * import_fieldsep.selectedItem = import_fieldsep.itemCount; }
		 */
		var charset = "";
		if (import_charset.selectedItem)
			charset = import_charset.selectedItem.label;

		/*
		 * trick to try to persist the manual input of the field if
		 * (import_charset.selectedIndex == -1 && import_charset.length != 0) {
		 * import_charset.appendItem(charset,charset);
		 * import_charset.selectedItem = import_charset.itemCount; }
		 */

		// dump2("linesep="+linesep);
		linesep = charsets[linesep];

		// dump2("linesep="+linesep);
		// dump2("fieldsep="+fieldsep);
		// dump2("charset="+charset);

		if (linesep.length != 0 && fieldsep.length != 0 && charset.length != 0) {
			var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1']
					.createInstance(Components.interfaces.nsIFileInputStream);
			fileStream.init(import_file, 1, 0, false);
			var converterStream = Components.classes['@mozilla.org/intl/converter-input-stream;1']
					.createInstance(Components.interfaces.nsIConverterInputStream);
			converterStream.init(fileStream, charset, fileStream.available(),
					converterStream.DEFAULT_REPLACEMENT_CHARACTER);
			var out = {};
			converterStream.readString(fileStream.available(), out);
			var fileContents = out.value;
			converterStream.close();
			fileStream.close();
			lines = fileContents.split(linesep)
			if (import_ignore1stline.checked)
				lines.shift();
			nbLine = lines.length;
			document.getElementById("nb_line").value = nbLine;
			document.getElementById("first_line").value = lines[0];
			// first_line
			firstLine = lines[0].split(fieldsep);
			nbField = firstLine.length;
			document.getElementById("nb_field").value = nbField;

			// alert(fileContents);
		} else {
			dump2("import_linesep.selectedIndex="
					+ import_linesep.selectedIndex);
			dump2("import_fieldsep.selectedIndex="
					+ import_fieldsep.selectedIndex);
			dump2("import_fieldsep.value=" + import_fieldsep.value);
			dump2("import_fieldsep.label=" + import_fieldsep.label);
			dump2("import_charset.selectedIndex="
					+ import_charset.selectedIndex);
			dump2("charset=" + charset);
		}
	} catch (e) {
		dump2(e);
	}

}

/**
 * Trouver un moyen d'enregistrer le mapping des champs QQ part dans les
 * préférences Indépendement de la langue (vraiment utile ?) Afin de pouvoir
 * le ré-afficher Et surtout ne pas être obliger de le refaire à chaque fois
 */
/*
 * function saveMap() { }
 */