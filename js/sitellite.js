function sitellite () {
	this.xmlhttp = new XMLHttpRequest ();
	this.browsers = 0;
	this.files = 0;
}

sitellite.prototype.error_handler = function (request) {
	alert ('Error: ' + request.statusText);
}

sitellite.prototype.get = function (url, handler) {
	this.xmlhttp.open ('GET', url, true);
	this.xmlhttp.send (null);
	if (this.xmlhttp.request.readyState == 4) {
		if (this.xmlhttp.request.status == 200) {
			return handler (this.xmlhttp.request);
		} else {
			return sitellite.error_handler (this.xmlhttp.request);
		}
	}
}

sitellite.prototype.domain = function (url) {
	domain = url.replace ('http://', '');
	domain = domain.replace ('https://', '');
	domain = domain.replace (/\/.*$/, '');
	return domain;
}

sitellite.prototype.add_site = function (url, user, pass) {
	domain = this.domain (url);

	db.add_param ('domain', domain);
	db.add_param ('url', url);
	db.add_param ('user', user);
	db.add_param ('pass', '');

	db.exec (
		'insert into sites (domain, url, user, pass) values (:domain, :url, :user, :pass)'
	);

	data = new air.ByteArray ();
	data.writeUTFBytes (pass);
	air.EncryptedLocalStore.setItem (domain + ':' + user, data);
}

sitellite.prototype.edit_site = function (domain, orig, url, user, pass) {
	new_domain = this.domain (url);

	pass = user.split (':')[1];
	user = user.split (':')[0];

	db.add_param ('old', domain);
	db.add_param ('orig', orig);
	db.add_param ('domain', new_domain);
	db.add_param ('url', url);
	db.add_param ('user', user);

	if (pass && pass.length > 0) {
		db.add_param ('pass', '');

		db.exec (
			'update sites set domain = :domain, url = :url, user = :user, pass = :pass where domain = :old and user = :orig'
		);

		if (domain != new_domain || orig != user) {
			air.EncryptedLocalStore.removeItem (new_domain + ':' + user);
		}

		data = new air.ByteArray ();
		data.writeUTFBytes (pass);
		air.EncryptedLocalStore.setItem (new_domain + ':' + user, data);
	} else {
		db.exec (
			'update sites set domain = :domain, url = :url, user = :user where domain = :old and user = :orig'
		);
	}
}

sitellite.prototype.delete_site = function (domain, user) {
	db.add_param ('domain', domain);
	db.add_param ('user', user);

	db.exec ('delete from sites where domain = :domain and user = :user');

	air.EncryptedLocalStore.removeItem (domain + ':' + user);
}

sitellite.prototype.get_sites = function () {
	sites = db.query (
		'select * from sites order by domain asc, user asc'
	);
	for (var i = 0; i < sites.length; i++) {
		sites[i].pass = air.EncryptedLocalStore.getItem (sites[i].domain + ':' + sites[i].user);
	}
	return sites;
}

sitellite.prototype.get_site = function (domain, user) {
	db.add_param ('domain', domain);
	db.add_param ('user', user);
	site = db.single ('select * from sites where domain = :domain and user = :user');
	site.pass = air.EncryptedLocalStore.getItem (site.domain + ':' + site.user);
	return site;
}

sitellite.prototype.launch_site = function (domain, user, pass, url) {
	width = 780;
	height = 580;

	sb = air.Screen.mainScreen.bounds;
	width = sb.width - 50;
	height = sb.height - 75;
	if (width > 1100) {
		width = 1050;
	}

	wleft = Math.round ((sb.width - width) / 2);
	wtop = Math.round ((sb.height - height) / 2);

	window.domain = domain;
	window.url = url;
	window.user = user;
	window.pass = pass;

	this.browsers++;

	var w = window.open ('browser.html', 'Browser' + this.browsers, 'width=' + width + ',height=' + height + ',top=' + wtop + ',left=' + wleft);
}

sitellite.prototype.show_files = function (domain, user, pass, url) {
	width = 750;
	height = 550;

	sb = air.Screen.mainScreen.bounds;
	wleft = Math.round ((sb.width - width) / 2);
	wtop = Math.round ((sb.height - height) / 2);

	window.domain = domain;
	window.url = url;
	window.user = user;
	window.pass = pass;

	this.files++;

	var w = window.open ('files.html', 'Files' + this.files, 'width=' + width + ',height=' + height + ',top=' + wtop + ',left=' + wleft + '&scrollbars=yes');
}

sitellite.prototype.site_monitor = function () {
	if (! window.runtime.air) {
		air.trace ('servicemonitor.swf not loaded (1)');
		return;
	}
	if (! window.runtime.air.net) {
		air.trace ('servicemonitor.swf not loaded (2)');
		return;
	}
	sites = this.get_sites ();
	if (sites.length == 0) {
		return;
	}
	monitor++;
	if (! sites[monitor]) {
		monitor = 0;
	}
	req = new air.URLRequest (sites[monitor].url + '#' + sites[monitor].user);
	req.method = air.URLRequestMethod.HEAD;
	monitors[monitor] = new air.URLMonitor (req);
	monitors[monitor].addEventListener (air.StatusEvent.STATUS, site_monitor_alert);
	monitors[monitor].start ();
}

function site_monitor_alert (event) {
	domain = s.domain (monitors[monitor].urlRequest.url);
	user = monitors[monitor].urlRequest.url.split ('#')[1];
	if (event.code == 'Service.available') {
		window.ui_site_up (domain, user);
	} else {
		window.ui_site_down (domain, user);
	}
}
