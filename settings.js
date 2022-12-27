function loadSettings() {
	const activeLocation = String(window.localStorage.getItem('activeLocation'));
	const time24 = window.localStorage.getItem('time24');

	if (window.location.hash !== '' && activeLocation != 'null') {
		let result = setLocation(activeLocation);
		if (!result) setDefaultLocation();
	} else {
		setDefaultLocation();
	}

	if (time24) {
		window.SETTING_24HR = (time24 === 'false') ? false : true;
	} else {
		window.SETTING_24HR = true;
	}
}

function setDefaultLocation() {
	let result = window.LOCATIONS.filter(location => {
		return location.NAME === 'Orison';
	});
	window.ACTIVE_LOCATION = result[0];
}

function saveSetting(key, value) {
	window.localStorage.setItem(key, value);
}