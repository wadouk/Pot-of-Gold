--@type table
--@name operations
CREATE TABLE operations (
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
)

--@type trigger
--@name maj_oper_updated
CREATE TRIGGER maj_oper_updated 
	after update on operations 
	for each row 
begin 
	update operations 
	set updated = current_timestamp 
	where id = old.id; 
end

--@type view
--@name vw_oper
CREATE VIEW vw_oper as
	select *, cast(amount as real)/100 as amount_dbl, 
	strftime('%m',date)-1 mdate,
	strftime('%d',date) ddate,
	strftime('%Y',date) ydate, 
	case length(substr(closed,0,1)) 
	when 1 then 4
	else case length(substr(checked,0,1))
	when 1 then 3
	else 2
	end
	end "state",
	case substr(amount,0,1)
		when "-" then -amount 
		else null 
	end debit,
	case substr(amount,0,1)
		when "-" then null 
		else amount 
	end credit,
	case substr(amount,0,1)
		when "-" then "deb" 
		else "cre" 
	end inout
from operations
order by strftime('%s',date) desc, id asc

--@type table
--@name tags
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT  ,
  value VARCHAR PRIMARY KEY  NOT NULL  UNIQUE 
)

--@type table
--@name operation_tags
create table operation_tags (
  id_tag integer,
  id_oper integer
)

--@type insert
--@name init_tags0-1
--@force true
insert into tags (value) as
select distinct categ from operations;

--@type insert
--@name transform categs to tags
--@force true
insert into operation_tags (id_tag, id_oper) as
select t.id as id_tag, o.id as id_oper
from operations_0 o, tags t
where o.categ = t.value