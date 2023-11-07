function loadSettings() {
	const activeLocation = String(window.localStorage.getItem('activeLocation'));
	const time24 = window.localStorage.getItem('time24');

	const mapPlanetTransparency = window.localStorage.getItem('mapPlanetTransparency');
	const mapGrid = window.localStorage.getItem('mapGrid');
	const mapTerminator = window.localStorage.getItem('mapTerminator');
	const mapOMs = window.localStorage.getItem('mapOMs');
	const mapTimes = window.localStorage.getItem('mapTimes');
	const mapStars = window.localStorage.getItem('mapStars');


	if (window.location.hash === '' && activeLocation != 'null') {
		let result = setMapLocation(activeLocation);
		if (!result) setDefaultLocation();
	
	} else if (window.location.hash === '') {
		setDefaultLocation();
	}

	if (time24) {
		window.SETTING_24HR = (time24 === 'false') ? false : true;
	} else {
		window.SETTING_24HR = true;
	}

	if (mapPlanetTransparency) {
		document.getElementById('map-settings-planet-transparency').value = parseInt(mapPlanetTransparency);
	}

	if (mapGrid) {
		document.getElementById('map-settings-show-grid').checked = (mapGrid === 'false') ? false : true;
	}

	if (mapTerminator) {
		document.getElementById('map-settings-show-terminator').checked = (mapTerminator === 'false') ? false : true;
	}

	if (mapOMs) {
		document.getElementById('map-settings-show-orbitalmarkers').checked = (mapOMs === 'false') ? false : true;
	}

	if (mapTimes) {
		document.getElementById('map-settings-show-times').checked = (mapTimes === 'false') ? false : true;
	}

	if (mapStars) {
		document.getElementById('map-settings-show-starfield').checked = (mapStars === 'false') ? false : true;
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