{
	[
	{"type":"table",
	"name":"operations",
	"sql":"CREATE TABLE operations (
	  id INTEGER PRIMARY KEY AUTOINCREMENT  ,
	  date DATETIME,
	  other VARCHAR,
	  categ VARCHAR,
	  amount INTEGER,
	  created DATETIME default current_timestamp,
	  updated DATETIME,
	  checked DATETIME,
	  closed DATETIME,
	  batch_num VARCHAR,
	  num INTEGER,
	  type VARCHAR
	)"
	
	
	
	]
}
