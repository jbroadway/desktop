/**
 * This package will provide the framework for a multilingual interface
 * to the Sitellite Desktop.
 */
function i18n (lang) {
	this.lang = lang;
	this.list = new Array ();
	this.list['fr:Add Site'] = 'Ajoutez un site';
	this.list['fr:Websites'] = 'Sites web';
	this.list['fr:Website'] = 'Site web';
	this.list['fr:Username'] = 'Nom d\'utilisateur';
	this.list['fr:Password'] = 'Mot de passe';
	this.list['fr:Link to Sitellite (e.g., http://www.example.com/index/cms-app)'] = 'Link to Sitellite (e.g., http://www.example.com/index/cms-app)';
	this.list['fr:Launch'] = 'Launch';
	this.list['fr:Files'] = 'Files';
	this.list['fr:Inbox'] = 'Inbox';
	this.list['fr:Settings'] = 'Settings';
	this.list['fr:Remove'] = 'Remove';
	this.list['fr:Options'] = 'Options';
	//this.list['en:'] = '';
}

/**
 * Automatically converts the contents of any <intl></intl> tags as well
 * as the value="" attribute of any <input type="submit" /> tag.
 */
i18n.prototype.init = function () {
	elements = document.getElementsByTagName ('intl');
	for (var i = 0; i < elements.length; i++) {
		elements[i].innerText = this.get (elements[i].innerText);
	}
	inputs = document.getElementsByTagName ('input');
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].getAttribute ('type') == 'submit') {
			inputs[i].setAttribute ('value', this.get (inputs[i].getAttribute ('value')));
		}
	}
}

/**
 * This is the method that you call to translate a string from the original
 * to the translated language.
 */
i18n.prototype.get = function (str) {
	var o = this.list[this.lang + ':' + str];
	if (o) {
		return o;
	}
	return str;
}
