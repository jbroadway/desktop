/**
 * Makes remote calls to a Sitellite site for filesystem-related commands.
 */

function webfiles (domain, user, pass, url) {
	this.domain = domain;
	this.user = user;
	this.pass = pass;
	this.url = url.replace (/\/(sitellite|cms-app)\/?/, '/');
	this.url_parts = parseUri (this.url);
	this.file_path = false;
	this.file_name = false;
	this.file_queue = false;
	this.status_list = [];
	this.access_list = [];
	this.team_list = [];

	//air.Introspector.Console.log (this.url_parts);

	air.URLRequestDefaults.setLoginCredentialsForHost (this.url_parts['domain'], user, pass);
	air.URLRequestDefaults.useCache = false;
}

webfiles.prototype.get_url = function (method, path) {
	return this.url_parts['protocol'] + '://' + this.url_parts['authority'] + this.url_parts['directory'] + 'cms-filesystem-rest-action/method.' + method + path;
}

webfiles.prototype.get_name = function (path) {
	if (path.match (/^[A-Z]:/)) {
		return path.split (/\\/).pop ();
	}
	return path.replace (/\/$/, '').split (/\//).pop ();
}

webfiles.prototype.make_id = function (path) {
	name = wf.get_name (path);
	return name.replace (/[^a-z0-9-]+/, '-').trim ('-');
}

webfiles.prototype.format_filesize = function (size) {
	if (size >= 1073741824) {
		return Math.round (size / 1073741824 * 10) / 10 + " GB";
	} else if (size >= 1048576) {
		return Math.round (size / 1048576 * 10) / 10 + " MB";
	} else if (size >= 1024) {
		return Math.round (size / 1024) + " KB";
	} else {
		return size + " B";
	}
}

webfiles.prototype.update_path = function (path) {
	path = path.replace (/\/$/, '');
	if (path.length == 0 || path == '/') {
		document.getElementById ('path').innerHTML = 'root';
		return false;
	}

	path = path.replace (/^\//, '');

	document.getElementById ('path').innerHTML = '';

	a = ui.el ('a');
	$(a).bind ('click', {path: '/'}, do_update);
	$(a).addClass ('parent');
	a.innerText = 'root';
	document.getElementById ('path').appendChild (a);

	dirs = path.split (/\//);
	new_path = '';
	for (var i = 0; i < dirs.length; i++) {
		if (i == dirs.length - 1) {
			slash = document.createTextNode (' / ' + dirs[i]);
			document.getElementById ('path').appendChild (slash);
		} else {
			new_path = '/' + dirs[i];
			a = ui.el ('a');
			$(a).bind ('click', {path: new_path}, do_update);
			$(a).addClass ('parent');
			a.innerText = dirs[i];

			slash = document.createTextNode (' / ');
			document.getElementById ('path').appendChild (slash);

			document.getElementById ('path').appendChild (a);
		}
	}
}

webfiles.prototype.error_handler = function (evt) {
	//air.Introspector.Console.log (evt);
	if (evt.status && evt.status != 200) {
		alert ('Error ' + evt.status);
		$('#msg').fadeOut ();
		$('#drop-msg').fadeOut ();
		evt.preventDefault ();
	}
}

webfiles.prototype.statuses_save = function (evt) {
	wf.status_list = JSON.parse (evt.target.data);
}

webfiles.prototype.statuses = function () {
	req = new air.URLRequest (this.get_url ('statuses', '/'));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, this.statuses_save);
	loader.load (req);
}

webfiles.prototype.access_levels_save = function (evt) {
	wf.access_list = JSON.parse (evt.target.data);
}

webfiles.prototype.access_levels = function () {
	req = new air.URLRequest (this.get_url ('access-levels', '/'));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, this.access_levels_save);
	loader.load (req);
}

webfiles.prototype.teams_save = function (evt) {
	wf.team_list = JSON.parse (evt.target.data);
}

webfiles.prototype.teams = function () {
	req = new air.URLRequest (this.get_url ('teams', '/'));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, this.teams_save);
	loader.load (req);
}

webfiles.prototype.list = function (path, handler) {
	req = new air.URLRequest (this.get_url ('list', path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, handler);
	loader.load (req);
}

webfiles.prototype.search = function (query, handler) {
	if (query == 'Search...' || query.length == 0) {
		return false;
	}

	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Searching...').show ();

	req = new air.URLRequest (this.get_url ('search', '/') + '?query=' + escape (query));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, handler);
	loader.load (req);
	return false;
}

webfiles.prototype.save_data = function (evt) {

	try {
		var f = wf.file_target;
		var stream = new air.FileStream ();
		stream.open (f, air.FileMode.WRITE);
		stream.writeBytes (evt.target.data, 0, evt.target.data.length);
		stream.close ();

		$('#msg').html ('Saved!').animate ({opacity: 1.0}, 1500).fadeOut ();
	} catch (e) {
		//air.Introspector.Console.log (e);

		$('#msg').html ('Error!').animate ({opacity: 1.0}, 1500).fadeOut ();
	}
}

webfiles.prototype.save_download = function (evt) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Downloading...').show ();

	wf.file_target = evt.target;

	req = new air.URLRequest (wf.get_url ('get', wf.file_path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.dataFormat = air.URLLoaderDataFormat.BINARY;
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.save_data);
	loader.load (req);
	return false;
}

webfiles.prototype.get = function (evt) {
	path = evt.data.path;
	wf.file_path = path;
	wf.file_name = wf.get_name (path);
	var d = air.File.documentsDirectory;
	loc = d.resolvePath (wf.file_name);
	try {
		loc.browseForSave ("Save As");
		loc.addEventListener (air.Event.SELECT, wf.save_download);
	} catch (e) {
		//air.Introspector.Console.log (e);
	}
	return false;
}

webfiles.prototype.mkdir_update = function (evt) {
	tb_remove ();
	res = JSON.parse (evt.target.data);
	wf.list (res.name, files_update);
}

webfiles.prototype.mkdir = function (new_dir) {
	new_dir = new_dir.toLowerCase ().replace (/[^a-z0-9 _-]+/, ' ');

	wf.file_name = new_dir;
	req = new air.URLRequest (this.get_url ('mkdir', current_path.replace (/\/$/, '') + '/' + new_dir));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, this.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, this.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, this.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.mkdir_update);
	loader.load (req);
	return false;
}

webfiles.prototype.put_update = function (evt) {
	//air.Introspector.Console.log (evt);
	res = JSON.parse (evt.target.data);
	//air.Introspector.Console.log (res);
	$('#msg').html ('Saved!').animate ({opacity: 1.0}, 1500).fadeOut ();
	wf.list (current_path, files_update);
}

webfiles.prototype.put = function (evt) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Uploading...').show ();

	var stream = new air.FileStream ();
	stream.open (evt.target, air.FileMode.READ);
	stream.position = 0;
	var data = new air.ByteArray ();
	stream.readBytes (data, 0, stream.bytesAvailable);
	stream.close ();

	file_name = wf.get_name (evt.target.url);
	req = new air.URLRequest (wf.get_url ('put', current_path.replace (/\/$/, '') + '/' + file_name));
	req.method = air.URLRequestMethod.PUT;
	//req.requestHeaders = new Array (new air.URLRequestHeader ('Content-Length', data.length));
	req.data = data;

	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.put_update);
	loader.load (req);

	return false;
}

webfiles.prototype.put_file = function () {
	file = wf.file_queue.shift ();
	if (! file) {
		wf.list (current_path, files_update);
		$('#drop-msg').html ('Done!').animate ({opacity: 1.0}, 1500).fadeOut ();
		return false;
	}

	if (file.isDirectory) {
		wf.put_file ();
		return false;
	}

	file_name = wf.get_name (file.url);

	$('#drop-msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Uploading "' + file_name + '"...').show ();

	var stream = new air.FileStream ();
	stream.open (file, air.FileMode.READ);
	stream.position = 0;
	var data = new air.ByteArray ();
	stream.readBytes (data, 0, stream.bytesAvailable);
	stream.close ();
	req = new air.URLRequest (wf.get_url ('put', current_path.replace (/\/$/, '') + '/' + file_name));
	req.method = air.URLRequestMethod.PUT;
	//req.requestHeaders = new Array (new air.URLRequestHeader ('Content-Length', data.length));
	req.data = data;

	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.put_file);
	loader.load (req);

	return false;
}

webfiles.prototype.drop_put = function (files) {
	wf.file_queue = files;
	wf.put_file ();
}

webfiles.prototype.copy_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Duplicated!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.copy_file = function (evt) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Duplicating...').show ();
	req = new air.URLRequest (wf.get_url ('copy', evt.data.path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.copy_update);
	loader.load (req);
	return false;
}

webfiles.prototype.move_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Moved!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.move_file = function (path, new_loc) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Moving...').show ();
	req = new air.URLRequest (wf.get_url ('move', path));
	req.method = air.URLRequestMethod.PUT;
	req.data = new_loc;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.move_update);
	loader.load (req);
	return false;
}

webfiles.prototype.move_file_up = function (path, new_loc) {
	if (new_loc == 'root') {
		new_loc = '/';
	} else {
		new_loc = current_path.split ('/' + new_loc).shift () + '/' + new_loc + '/';
	}

	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Moving...').show ();
	req = new air.URLRequest (wf.get_url ('move', path));
	req.method = air.URLRequestMethod.PUT;
	req.data = new_loc;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.move_update);
	loader.load (req);
	return false;
}

webfiles.prototype.delete_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Deleted!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.delete_file = function (evt) {
	if (! confirm ('Are you sure you want to delete ' + wf.get_name (evt.data.path) + '?')) {
		return false;
	}
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Deleting...').show ();
	req = new air.URLRequest (wf.get_url ('delete', evt.data.path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.delete_update);
	loader.load (req);
	return false;
}

webfiles.prototype.lock_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Locked!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.lock_file = function (evt) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Locking...').show ();
	req = new air.URLRequest (wf.get_url ('lock', evt.data.path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.lock_update);
	loader.load (req);
	return false;
}

webfiles.prototype.unlock_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Unlocked!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.unlock_file = function (evt) {
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Unlocking...').show ();
	req = new air.URLRequest (wf.get_url ('unlock', evt.data.path));
	req.method = air.URLRequestMethod.GET;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.unlock_update);
	loader.load (req);
	return false;
}

webfiles.prototype.edit_file_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Saved!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.edit_file = function (form) {
	data = JSON.stringify ({
		name: form.elements.name.value,
		keywords: form.elements.keywords.value,
		description: form.elements.description.value,
		access: form.elements.access.value,
		status: form.elements.status.value,
		team: form.elements.team.value
	});
	tb_remove ();
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Saving...').show ();
	req = new air.URLRequest (wf.get_url ('edit', form.elements.path.value));
	req.method = air.URLRequestMethod.PUT;
	req.data = data;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.edit_file_update);
	loader.load (req);
	return false;
}

webfiles.prototype.edit_folder_update = function (evt) {
	wf.list (current_path, files_update);
	$('#msg').html ('Saved!').animate ({opacity: 1.0}, 1500).fadeOut ();
}

webfiles.prototype.edit_folder = function (form) {
	data = JSON.stringify ({
		name: form.elements.name.value
	});
	tb_remove ();
	$('#msg').html ('<img src="pix/loading.gif" alt="" border="0" align="left" /> Saving...').show ();
	req = new air.URLRequest (wf.get_url ('edit', form.elements.path.value));
	req.method = air.URLRequestMethod.PUT;
	req.data = data;
	loader = new air.URLLoader ();
	loader.addEventListener (air.SecurityErrorEvent.SECURITY_ERROR, wf.error_handler);
	loader.addEventListener (air.HTTPStatusEvent.HTTP_STATUS, wf.error_handler);
	loader.addEventListener (air.IOErrorEvent.IO_ERROR, wf.error_handler);
	loader.addEventListener (air.Event.COMPLETE, wf.edit_folder_update);
	loader.load (req);
	return false;
}
