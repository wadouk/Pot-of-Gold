Components.utils.import("resource://app/modules/utils.js");
Components.utils.import("resource://app/modules/debug.js");
var EXPORTED_SYMBOLS = [ "myDb", "Upd", "Ins" ];


function Upd() {
	this.table = "";
	this.newVals = {};
	this.oldVals = {};
}

function Ins() {
	this.table = "";
	this.vals = [];
}

function db() {
	dump2("db constructor");
	this.mDBConn = null;

	try {
		var type = Prefs.getDbLocType();
		var ds = Prefs.getDbLocPath();

		// dump2("ds="+ds);

		var file;
		var propName;
		switch (type) {
		case 0:
			propName = "AChrom";
			break;
		case 1:
			propName = "ProfD";
			break;

		}

		// dump2("propName="+propName);
		file = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties).get(propName,
						Components.interfaces.nsIFile);

		if (type == 0)
			file.append("db");

		file.append(ds);
		dump2("file.path=" + file.path);
		// dump2("ds.target="+file.target);
		var storageService = Components.classes["@mozilla.org/storage/service;1"]
				.getService(Components.interfaces.mozIStorageService);
		this.mDBConn = storageService.openDatabase(file);
		this.checkVersionAndPatch();
		// this.mDBConn.beginTransaction();
		// Will also create the file if it does not exist
	} catch (e) {
		dump2(e);
		throw e;
	}

};
/**
 * <pre>
 * Lister les scripts présents
 * pour chaque script
 * parser :
 * - chercher les requêtes
 * - charger en objet {fromversion,toversion,queries=[{type,nom,sql,force}]*}
 * si fromversion = user version {
 * 	regarder les objets qui existent
 * 	si table avec même nom existe {
 * 		recupération du sql
 * }
 * 	si sql identique, rien à faire 
 * 	si sql différent, renommer ancienne table à la version fromversion {
 * 		créer nouvelle table
 * 		migrer les données (insert as select) 
 * 		avec les colonnes qui ont le même nom
 * 		des deux côtés
 * }
 * 	si vue ou index existe déjà et force = true ou vue n'existe pas alors {
 * 		drop vue ou index si existante et création de la vue
 * }
 * 	si autre type (update, insert, migrate) et force = true {
 * 		exécution de la requête
 * 		}
 * 	maj du user version à toversion
 * 	}
 * </pre>
 */
db.prototype.checkVersionAndPatch = function() {
	file = Components.classes["@mozilla.org/file/directory_service;1"]
			.getService(Components.interfaces.nsIDirectoryServiceProvider).get(
					"resource:app", Components.interfaces.nsIFile);

	dump2("file=" + file.path);
	// /file = file.parent;
	file.append("sql");
	var entries = file.directoryEntries;
	var array = [];
	var struct = [];
	while (entries.hasMoreElements()) {
		var entry = entries.getNext();
		// dump2("entry="+entry.path);
		entry.QueryInterface(Components.interfaces.nsIFile);
		if (entry.leafName.match(/^\d*-\d*\.sql$/)) {

			var fileStream = Components.classes['@mozilla.org/network/file-input-stream;1']
					.createInstance(Components.interfaces.nsIFileInputStream);
			fileStream.init(entry, 1, 0, false);
			var converterStream = Components.classes['@mozilla.org/intl/converter-input-stream;1']
					.createInstance(Components.interfaces.nsIConverterInputStream);
			converterStream.init(fileStream, "UTF8", fileStream.available(),
					converterStream.DEFAULT_REPLACEMENT_CHARACTER);
			var out = {};
			converterStream.readString(fileStream.available(), out);
			var fileContents = out.value;
			converterStream.close();
			fileStream.close();

			var queries = fileContents.split("\n\n");
			for ( var j = 0; j < queries.length; j++) {
				var tuple = {};
				var queryprops = queries[j];
				// dump2("query["+j+"]="+ queryprops);
				var lines = queryprops.split(/\n/gm)
				// dump2("query["+j+"]="+ lines);
				for ( var k = 0; k < lines.length; k++) {
					// dump2("all lines["+k+"]="+lines[k]);
					if (lines[k].match("^--")) {
						// dump2("header lines["+k+"]="+lines[k]);
						try {
							var key = lines[k].match(/@(\S*)/g)[0].substring(1);
							var value = lines[k].match(/(\S*)$/g)[0];
							tuple[key] = value;
						} catch (e) {
							dump2("e lines[" + k + "]=" + lines[k]);
						}
					} else {
						// query
						if (tuple.query)
							tuple.query = tuple.query + '\n' + lines[k];
						else
							tuple.query = lines[k];
					}
				}
				for ( var el in tuple) {
					// if ( el != 'query')
					dump2("tuple[" + el + "]=" + tuple[el]);
				}
				// dump2("@"+tuple.key+"="+ tuple.value);
				// dump2("sql="+tuple.query);
				struct.push(tuple);
				tuple = undefined;

			}
			dump2("struct length=" + struct.length);
		}
	}

	for ( var i = 0; i < array.length; i++) {
	}

}
db.prototype.bind = function(statement, where) {
	for ( var i = 0; i < statement.parameterCount; i++) {
		var type;
		var paramName = statement.getParameterName(i).substring(1);
		if (!where[paramName] || where[paramName] == ""
				|| where[paramName] == null) {
			type = "null";
			statement.bindNullParameter(i, where[paramName]);
		} else {
			type = "string";
			statement.bindStringParameter(i, where[paramName]);
		}
		dump2("bind " + paramName + "=" + where[paramName] + " (" + type + ")");
	}
}

db.prototype.get = function(select, tableName, where) {
	var request = "";
	request = "select " + select.join(",");
	if (tableName && tableName != null) {
		request += " from " + tableName;
		if (where && where != null) {
			for ( var fields in where) {
				if (request.indexOf("where") == -1)
					request += " where ";
				request += " " + fields + "=:" + fields;
			}
		}
	}
	request += ";";
	dump2("request=" + request);
	var statement = this.mDBConn.createStatement(request);
	if (request.indexOf("where") != -1)
		this.bind(statement, where);
	var result = {};
	var curLine = 0;
	while (statement.executeStep()) {
		for ( var i = 0; i < select.length; i++) {
			var name = statement.getColumnName(i);
			var val;
			switch (statement.getTypeOfIndex(i)) {
			case Components.interfaces.mozIStorageValueArray.VALUE_TYPE_NULL:
				val = null;
				break;
			case Components.interfaces.mozIStorageValueArray.VALUE_TYPE_INTEGER:
				val = statement.getInt64(i);
				break;
			case Components.interfaces.mozIStorageValueArray.VALUE_TYPE_FLOAT:
				val = statement.getDouble(i);
				break;
			case Components.interfaces.mozIStorageValueArray.VALUE_TYPE_TEXT:
				val = statement.getUTF8String(i);
				break;
			/*
			 * case Components.interfaces.mozIStorageValueArray.VALUE_TYPE_BLOB:
			 * 
			 * break;
			 */
			}

			result[name] = [];
			result[name][curLine] = val;
		}
		curLine++;
	}
	statement.reset();
	return result;
}

db.prototype.now = function() {
	var now = this.get([ "current_timestamp as now" ], null, null);
	return now.now;
}
/**
 * @param nbExpected
 *            le nombre d'enregistrement attendu
 * @lenient Ã  positionner Ã  true pour qu'aucune erreur explose
 */
db.prototype.check = function(nbExpected, lenient) {
	var rs = this.get([ "changes() as changes" ], null, null);
	dump2(rs);
	if (rs.changes[0] != nbExpected) {
		var not_enough_results = mainSB.getString("not_enough_results",
				nbExpected, rs.changes[0]);
		if (!lenient)
			throw new Error(not_enough_results);
		else
			log({
				flag : Components.interfaces.nsIScriptError.warningFlag,
				msg : not_enough_results
			});
	}
	// dump2("lastErrorString="+this.mDBConn.lastErrorString);
	var notanerror = (this.mDBConn.lastErrorString.indexOf("not an error") != -1)
	if (!notanerror || this.mDBConn.lastError != 0)
		throw new Error("DB Error:" + this.mDBConn.lastErrorString);
}

db.prototype.del = function(tableName, id) {
	var request = "";
	request = "delete from " + tableName;
	request += " where ";
	request += " id = :id";
	request += ";";
	this.execRequest(request, {
		"id" : id
	}, 1);

	// dump2("request=" + request);
	// var statement;
	// try {
	// statement = this.mDBConn.createStatement(request);
	// statement.bindStringParameter(0, id);
	// this.mDBConn.beginTransaction();
	// statement.execute();
	// this.check(1);
	// this.mDBConn.commitTransaction();
	// } catch (e) {
	// if (this.mDBConn.transactionInProgress)
	// this.mDBConn.rollbackTransaction();
	// dump2("lastErrorString=" + this.mDBConn.lastErrorString);
	// throw e;
	// }

}
db.prototype.execByOther = function(obj, expectedChanges) {

	if (obj instanceof Upd) {
		var toBind = {};
		var iParamToBind = 0;
		var request = "update " + obj.table + " set ";
		for ( var val in obj.newVals) {
			request += val + "=:" + val + iParamToBind;
			request += ", ";
			toBind[val + iParamToBind] = obj.newVals[val];
			iParamToBind++;
		}
		request = request.substring(0, request.length - ", ".length);
		request += " where ";
		for ( var val in obj.oldVals) {
			if (obj.oldVals[val] == "") {
				request += val + " is null";
			} else {
				request += val + "=:" + val + iParamToBind;
				toBind[val + iParamToBind] = obj.oldVals[val];
				iParamToBind++;
			}
			// request += val + "=:" + obj.oldVals[val];
			request += " and ";
		}
		request = request.substring(0, request.length - " and ".length);
		this.execRequest(request, toBind, expectedChanges);
	} else if (obj instanceof Ins) {

	}

}
db.prototype.execRequest = function(request, params, expectedChanges) {
	dump2(request);
	var statement;
	try {
		statement = this.mDBConn.createStatement(request);
		this.bind(statement, params);
		this.mDBConn.beginTransaction();
		statement.execute();
		this.check(expectedChanges);
		this.mDBConn.commitTransaction();
	} catch (e) {
		if (this.mDBConn.transactionInProgress)
			this.mDBConn.rollbackTransaction();
		dump2("lastErrorString=" + this.mDBConn.lastErrorString);
		throw e;
	}
}
/**
 * Faire un update ou un insert sur une table donnï¿½e en fonction de la
 * prï¿½sence ou pas de l'id dans la liste des champs
 * 
 * @param obj
 *            {tableau associatif} la liste des champs clef / valeur
 * @param tableName
 *            {string} le nom de la table ï¿½ modifier
 */
db.prototype.exec = function(obj, tableName) {
	var request = "";
	var fields = [];
	for ( var a in obj) {
		if (a != "id")
			fields.push(a);
	}
	var expectedChanges = 0;
	dump2("exec");
	dump2(obj);
	if (obj.id) {
		// maj
		request = "update " + tableName + " set ";
		for ( var i = 0; i < fields.length; i++) {
			request += fields[i] + "=:" + fields[i];
			if (i < fields.length - 1)
				request += ", ";
		}
		request += " where ";
		if (getTypeOf(obj.id) == "array" && obj.id.length > 1) {
			for ( var i = 0; i < obj.id.length; i++) {
				request += "id = :id" + i;
				if (i < obj.id.length - 1)
					request += " or ";
				obj["id" + i] = obj.id[i];
				expectedChanges++;
			}
			// request += " id in (:id)";
		} else {
			request += " id = :id";
			expectedChanges++;
		}
	} else {
		// id est vide donc insert
		request = "insert into " + tableName + " (";
		request += fields.join(",");
		request += ") values (:";
		request += fields.join(",:");
		request += ");";
		expectedChanges++;
	}
	this.execRequest(request, obj, expectedChanges);
};

var myDb;

if (myDb || myDb == null) {
	myDb = new db();
}
