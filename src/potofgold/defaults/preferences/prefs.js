pref("toolkit.defaultChromeURI", "chrome://potofgold/content/main.xul");
pref("toolkit.defaultChromeFeatures", "chrome,resizable,center");
pref("extensions.potofgold.dbloc.type", 0);
pref("extensions.potofgold.dbloc.path", "potofgold-sample.sqlite");
pref("extensions.potofgold.currencyUnit", 8364);

pref("extensions.potofgold.find", "Ce mois,Dernier import");
pref(
		"extensions.potofgold.find.Ce mois",
		"select * from vw_oper where strftime('%s',date) > strftime('%s',date('now','start of month'))");
pref(
		"extensions.potofgold.find.Dernier import",
		"select * from vw_oper where batch_num = ( select batch_num from operations where date in ( select max(date) from operations where batch_num is not null))");