/**
 * Database API wrapper, making it easier to code cleanly with databases
 * in Adobe AIR.  Note: Works synchronously, it's much easier that way :)
 *
 * Example:
 *
 * <script src="js/db.js" type="text/javascript"></script>
 * <script type="text/javascript">
 * var db;
 *
 * function onload () {
 *     db = new database ();
 *     db.init ('my_database.db');
 * }
 *
 * function onunload () {
 *     db.close ();
 * }
 *
 * function fetch_stuff () {
 *     return db.query ('select * from my_table');
 * }
 *
 * </script>
 *
 */
function database () {
	this.conn = null;
	this.stmt = null;
	this.file = null;
	this.plist = new Array ();
	this.total = 0;
	this.res = null;
	this.row = null;
	this.cell = null;
}

/**
 * Open the specified database file.  Call this before any exec() or
 * query() calls.
 */
database.prototype.init = function (file) {
	this.conn = new air.SQLConnection ();
	this.file = air.File.applicationDirectory.resolvePath (file);
	this.conn.open (this.file);
}

/**
 * Close the database file.  Call this in the onunload event hander.
 */
database.prototype.close = function () {
	this.conn.close ();
}

/**
 * Adds a parameters key/value pair to the next query() to be issued.
 */
database.prototype.add_param = function (n, v) {
	this.plist.push ({name: n, value: v});
}

/**
 * Executes the specified SQL query, returning no results.  Used for
 * non-SELECT statements.
 */
database.prototype.exec = function (sql) {
	this.stmt = new air.SQLStatement ();
	this.stmt.sqlConnection = this.conn;
	this.stmt.clearParameters ();
	this.stmt.text = sql;

	for (var i = 0; i < this.plist.length; i++) {
		this.stmt.parameters[':' + this.plist[i].name] = this.plist[i].value;
	}

	this.stmt.execute ();
	this.plist = new Array ();
}

/**
 * Executes the specified SQL query and returns the results.  Also sets
 * the total property with the number of results.
 */
database.prototype.query = function (sql) {
	this.stmt = new air.SQLStatement ();
	this.stmt.sqlConnection = this.conn;
	this.stmt.clearParameters ();
	this.stmt.text = sql;

	for (var i = 0; i < this.plist.length; i++) {
		this.stmt.parameters[':' + this.plist[i].name] = this.plist[i].value;
	}

	this.stmt.execute ();
	this.plist = new Array ();

	this.res = this.stmt.getResult ();
	if (this.res.data) {
		this.total = this.res.data.length;
		return this.res.data;
	}
	this.total = 0;
	return Array ();
}

/**
 * Returns the first result only from the specified SQL query.  Useful
 * for selecting a single item via its primary key.
 */
database.prototype.single = function (sql) {
	this.stmt = new air.SQLStatement ();
	this.stmt.sqlConnection = this.conn;
	this.stmt.clearParameters ();
	this.stmt.text = sql;

	for (var i = 0; i < this.plist.length; i++) {
		this.stmt.parameters[':' + this.plist[i].name] = this.plist[i].value;
	}

	this.stmt.execute ();
	this.plist = new Array ();

	this.res = this.stmt.getResult ();
	this.total = this.res.data.length;
	if (this.res.data[0]) {
		return this.res.data[0];
	}
	return false;
}

/**
 * Returns the first field from the first result from the specified
 * SQL query.  Useful for SELECT COUNT(*) types of queries.
 */
database.prototype.shift = function (sql) {
	res = this.single (sql);
	for (var i in res) {
		return res[i];
	}
	return false;
}

/**
 * Returns the first field only as an array of results from the specified
 * SQL query.  The array items are not result data objects, rather just
 * the value of the first field of each result.  Useful for retrieving
 * just one column from a table, e.g., SELECT id FROM ...
 */
database.prototype.shift_array = function (sql) {
	res = this.query (sql);
	out = new Array ();
	for (var i = 0; i < res.length; i++) {
		for (var c in res[i]) {
			out.push (res[i][c]);
			break;
		}
	}
	return out;
}

/**
 * Returns the first two columns of the results from the specified SQL
 * query as a list of key/value pairs.  Useful for queries like SELECT
 * id, title FROM ...
 */
database.prototype.pairs = function (sql) {
	res = this.query (sql);
	out = new Array ();
	for (var i = 0; i < res.length; i++) {
		k = false;
		v = false;
		for (var c in res[i]) {
			if (k == false) {
				k = res[i][c];
			} else if (v == false) {
				v = res[i][c];
			} else {
				break;
			}
		}
		out[k] = v;
	}
	return out;
}
