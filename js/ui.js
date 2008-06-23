/**
 * Application GUI interaction layer.
 */
function gui () {
	this.sites = document.getElementById ('sites');
	this.alt = {
		current : 'even',
		next : function () {
			if (this.current == 'odd') {
				this.current = 'even';
				return this.current;
			}
			this.current = 'odd';
			return this.current;
		},
		reset : function () {
			this.current = 'even';
		}
	};
}

/**
 * Initialize the main screen.
 */
gui.prototype.init = function () {
	var list = s.get_sites ();
	if (list.length > 0) {
		this.update_sites (list);
	}
}

/**
 * Gets an element by its id attribute.
 */
gui.prototype.get = function (name) {
	return document.getElementById (name);
}

/**
 * Creates a new element with the specified name and attributes.
 */
gui.prototype.el = function (name) {
	element = document.createElement (name);
	if (arguments.length > 1) {
		for (var x in arguments[1]) {
			element.setAttribute (x, arguments[1][x]);
		}
	}
	return element;
}

/**
 * Update the website list.
 */
gui.prototype.update_sites = function (list) {
	out = this.el ('div');
	p = this.el ('p');
	p.innerHTML = '<strong>' + intl.get ('Websites') + ' (' + list.length + '): <a href="#" onclick="return ui.show_add_site ()">' + intl.get ('Add Site') + '</strong>';
	out.appendChild (p);

	t = this.el ('table', {cellspacing: 1, cellpadding: 5});

	tr = this.el ('tr');
	th = this.el ('th');
	th.innerText = intl.get ('Website');
	tr.appendChild (th);

	th = this.el ('th');
	th.innerText = intl.get ('Username');
	tr.appendChild (th);

	th = this.el ('th');
	//th.colSpan = 5;
	th.innerText = intl.get ('Options');
	tr.appendChild (th);
	t.appendChild (tr);

	this.alt.reset ();

	s.dock_menu (list);

	for (var i = 0; i < list.length; i++) {
		domain = list[i].domain;
		user = list[i].user;
		pass = list[i].pass;
		url = list[i].url;

		// write a table row for this site
		tr = this.el ('tr');
		tr.setAttribute ('class', this.alt.next ());
		tr.setAttribute ('id', domain + '-' + user);

		//td = this.el ('td', {width: '32%'});
		td = this.el ('td', {width: '40%'});
		td.innerText = domain;
		tr.appendChild (td);

		//td = this.el ('td', {width: '16%'});
		td = this.el ('td', {width: '20%'});
		td.style.textAlign = 'center';
		td.innerText = user;
		tr.appendChild (td);

		td = this.el ('td');
		td.style.textAlign = 'center';

		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user, pass: pass, url: url}, this.launch_site);
		a.innerHTML = '<img src="pix/launch.gif" alt="" border="0" /> ' + intl.get ('Launch');
		td.appendChild (a);

		//tr.appendChild (td);

		/*pipe = this.el ('span');
		pipe.setAttribute ('class', 'pipe');
		pipe.innerHTML = ' &nbsp;|&nbsp; ';
		td.appendChild (pipe);

		//td = this.el ('td');
		td.style.textAlign = 'center';
		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user}, this.show_files);
		a.innerHTML = '<img src="pix/files.gif" alt="" border="0" /> ' + intl.get ('Files');
		td.appendChild (a);
		//tr.appendChild (td);

		pipe = this.el ('span');
		pipe.setAttribute ('class', 'pipe');
		pipe.innerHTML = ' &nbsp;|&nbsp; ';
		td.appendChild (pipe);

		//td = this.el ('td');
		td.style.textAlign = 'center';
		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user}, this.show_inbox);
		a.innerHTML = '<img src="pix/inbox.gif" alt="" border="0" /> ' + intl.get ('Inbox') + ' (0)';
		td.appendChild (a);
		//tr.appendChild (td);*/

		pipe = this.el ('span');
		pipe.setAttribute ('class', 'pipe');
		pipe.innerHTML = ' &nbsp;|&nbsp; ';
		td.appendChild (pipe);

		//td = this.el ('td');
		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user, pass: pass, url: url}, this.show_files);
		a.innerHTML = '<img src="pix/files.gif" alt="" border="0" /> ' + intl.get ('Files');
		td.appendChild (a);

		pipe = this.el ('span');
		pipe.setAttribute ('class', 'pipe');
		pipe.innerHTML = ' &nbsp;|&nbsp; ';
		td.appendChild (pipe);

		//td = this.el ('td');
		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user}, this.show_edit_site);
		a.innerHTML = '<img src="pix/settings.gif" alt="" border="0" /> ' + intl.get ('Settings');
		td.appendChild (a);
		//tr.appendChild (td);

		pipe = this.el ('span');
		pipe.setAttribute ('class', 'pipe');
		pipe.innerHTML = ' &nbsp;|&nbsp; ';
		td.appendChild (pipe);

		//td = this.el ('td');
		a = this.el ('a', {href: '#'});
		$(a).bind ('click', {domain: domain, user: user}, this.delete_site);
		a.innerHTML = '<img src="pix/remove.gif" alt="" border="0" /> ' + intl.get ('Remove');
		td.appendChild (a);

		tr.appendChild (td);

		t.appendChild (tr);
	}
	out.appendChild (t);
	document.getElementById ('welcome').style.display = 'none';
	document.getElementById ('add-form').style.display = 'none';
	document.getElementById ('edit-form').style.display = 'none';
	document.getElementById ('sites').style.display = 'block';
	this.sites.innerHTML = '';
	this.sites.appendChild (out);
	return false;
}

gui.prototype.show_add_site = function () {
	document.getElementById ('sites').style.display = 'none';
	document.getElementById ('edit-form').style.display = 'none';
	document.getElementById ('add-form').style.display = 'block';
}

gui.prototype.add_site = function (form) {
	s.add_site (
		form.elements['url'].value,
		form.elements['user'].value,
		form.elements['pass'].value
	);

	form.elements['url'].value = '';
	form.elements['user'].value = '';
	form.elements['pass'].value = '';

	list = s.get_sites ();
	this.update_sites (list);

	return false;
}

gui.prototype.hide_add = function (form) {
	list = s.get_sites ();
	this.update_sites (list);
	return false;
}

gui.prototype.show_edit_site = function (event) {
	domain = event.data.domain;
	user = event.data.user;

	//save = intl.get ('Save');
	//cancel = intl.get ('Cancel');

	curr_info = s.get_site (domain, user);

	form = document.getElementById ('edit');
	form.elements['orig_domain'].value = domain;
	form.elements['orig_user'].value = user;
	form.elements['url'].value = curr_info.url;
	form.elements['user'].value = curr_info.user;
	form.elements['pass'].value = '';

	document.getElementById ('sites').style.display = 'none';
	document.getElementById ('add-form').style.display = 'none';
	document.getElementById ('edit-form').style.display = 'block';

	return false;
}

gui.prototype.edit_site = function (form) {
	s.edit_site (
		form.elements['orig_domain'].value,
		form.elements['orig_user'].value,
		form.elements['url'].value,
		form.elements['user'].value + ':' + form.elements['pass'].value,
		form.elements['pass'].value
	);
	list = s.get_sites ();
	this.update_sites (list);
	return false;
}

gui.prototype.hide_edit = function (form) {
	form = document.getElementById ('edit');
	form.elements['orig_domain'].value = '';
	form.elements['orig_user'].value = '';
	form.elements['url'].value = '';
	form.elements['user'].value = '';
	form.elements['pass'].value = '';

	list = s.get_sites ();
	this.update_sites (list);
	return false;
}

gui.prototype.delete_site = function (event) {
	if (confirm (intl.get ('Are you sure you want to remove this site?'))) {
		domain = event.data.domain;
		user = event.data.user;
		s.delete_site (domain, user);
		list = s.get_sites ();
		if (list.length > 0) {
			ui.update_sites (list);
		} else {
			document.getElementById ('sites').style.display = 'none';
			document.getElementById ('welcome').style.display = 'block';
			document.getElementById ('add-form').style.display = 'block';
		}
	}
	return false;
}

gui.prototype.launch_site = function (event) {
	s.launch_site (
		event.data.domain,
		event.data.user,
		event.data.pass,
		event.data.url
	);
	return false;
}

gui.prototype.show_files = function (event) {
	s.show_files (
		event.data.domain,
		event.data.user,
		event.data.pass,
		event.data.url
	);
	return false;
}

function site_monitor () {
	return s.site_monitor ();
}

gui.prototype.site_down = function (domain, user) {
	tr = document.getElementById (domain + '-' + user);
	cls = tr.getAttribute ('class');
	if (! cls.match ('site-down')) {
		tr.setAttribute ('class', cls + ' site-down');
		down++;
		document.getElementById ('alert').style.display = 'block';
		s.system_alert ();
	}
}

gui.prototype.site_up = function (domain, user) {
	tr = document.getElementById (domain + '-' + user);
	cls = tr.getAttribute ('class');
	if (cls.match ('site-down')) {
		cls = cls.replace ('site-down', '');
		down--;
		if (down == 0) {
			document.getElementById ('alert').style.display = 'none';
		}
	}
	tr.setAttribute ('class', cls);
}
