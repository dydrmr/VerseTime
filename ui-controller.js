let hoverLocation = null;

document.getElementById('BUTTON-share-location').addEventListener('click', function(e) { shareLocation(); });

function getHashedLocation() {
	let loc = window.ACTIVE_LOCATION.NAME;
	return loc.replaceAll(' ', '_');
}

function shareLocation() {
	const url = location.protocol + '//' + location.host + location.pathname + '#' + getHashedLocation();
	navigator.clipboard.writeText(url);
	
	const msg = document.getElementById('share-location-message');
	msg.style.transition = '0s ease-out';
	msg.style.opacity = 1;

	setTimeout(() => {
		msg.style.transition = '1s ease-out';
		msg.style.opacity = 0;
	}, 2000)
}



// KEYBOARD INPUT
document.addEventListener('keydown', function (event) {
	if (event.target.tagName.toLowerCase() === 'input') { return; }

	if (event.key === 't') {
		window.SETTING_24HR = !window.SETTING_24HR;
		saveSetting('time24', window.SETTING_24HR);
	}
});



// LOCATION SEARCH FILTER
document.getElementById('location-selection-input').addEventListener('input', (event) => { 
	let search = document.getElementById("location-selection-input").value.toLowerCase();
	let searchFragments = search.split('+');
	let buttons = document.getElementsByClassName('BUTTON-set-location');

	for (let element of buttons) {

		if (search === '') {
			element.classList.remove('hide');
			continue;
		}

		let found = Array();
		for (let [index, fragment] of searchFragments.entries()) {
			if (fragment === '') continue;
			found[index] = (element.innerText.toLowerCase().includes(fragment)) ? true : false;
		}

		let result = found.every((value) => value === true);
		result ? element.classList.remove('hide') : element.classList.add('hide');
	}
});

function showMapLocationData(location, triggerElement) {
	hoverLocation = location;

	document.getElementById('map-locationinfo-window').style.opacity = 1;

	window.setText('map-info-locationname', location.NAME);
	window.setText('map-info-locationtype', location.TYPE);
	window.setText('map-info-elevation', Math.round(location.ELEVATION * 1000, 1).toLocaleString());
	updateMapLocationData();
	setInterval(updateMapLocationData, 250);
}

function updateMapLocationData() {
	if (!hoverLocation) return;
	window.setText('map-info-phase', hoverLocation.ILLUMINATION_STATUS);

	let nextRise, nextSet;

	const unchanging = ['Polar Day', 'Polar Night', 'Permanent Day', 'Permanent Night'];
	if (unchanging.includes(hoverLocation.ILLUMINATION_STATUS)) {
		nextRise = '---';
		nextSet = '---';

	} else {

		if (hoverLocation.IS_STAR_RISING_NOW) {
			nextRise = '- NOW -';
		} else {
			nextRise = window.HOURS_TO_TIME_STRING(hoverLocation.NEXT_STAR_RISE * 24, true, false);
		}

		if (hoverLocation.IS_STAR_SETTING_NOW) {
			nextSet = '- NOW -';
		} else {
			nextSet = window.HOURS_TO_TIME_STRING(hoverLocation.NEXT_STAR_SET * 24, true, false);
		}

	}

	window.setText('map-info-nextstarrise', nextRise);
	window.setText('map-info-nextstarset', nextSet);
}

function hideMapLocationData() {
	document.getElementById('map-locationinfo-window').style.opacity = 0;
	hoverLocation = null;
	clearInterval(updateMapLocationData);
}