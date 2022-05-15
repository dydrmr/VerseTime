function loadSettings() {
	const activeLocation = String(window.localStorage.getItem('activeLocation'));
	const time24 = window.localStorage.getItem('time24');

	if (activeLocation) {
		let result = setLocation(activeLocation);
		if (!result) window.ACTIVE_LOCATION = ORISON;
	} else {
		window.ACTIVE_LOCATION = ORISON;
	}

	if (time24) {
		window.SETTING_24HR = (time24 === 'false') ? false : true;
	} else {
		window.SETTING_24HR = true;
	}
}

function saveSetting(key, value) {
	window.localStorage.setItem(key, value);
}