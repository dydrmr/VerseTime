let showSettingsWindow = false;
let showCreditsWindow = false;
let showMapWindow = false;
let showAtlasWindow = false;
let hoverLocation = null;

document.getElementById('BUTTON-open-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });
document.getElementById('BUTTON-close-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });

function toggleSettingsWindow(forceState = null) {

	if (forceState) {
		showSettingsWindow = (forceState === 'on') ? true : false;
	} else {
		showSettingsWindow = !showSettingsWindow;
	}

	document.getElementById('modal-settings').style.opacity = (showSettingsWindow ? 1 : 0);
	document.getElementById('modal-settings').style.pointerEvents = (showSettingsWindow ? 'auto' : 'none');
	document.getElementById('settings-window').style.transform = (showSettingsWindow ? 'scale(1)' : 'scale(0)');

	if (showSettingsWindow) {
		document.getElementById('location-selection-input').focus();
	} else {
		document.getElementById('location-selection-input').blur();
	}

}


document.getElementById('BUTTON-toggle-credits-window').addEventListener('click', function(e) { toggleCreditsWindow(); });
document.getElementById('BUTTON-close-credits').addEventListener('click', function(e) { toggleCreditsWindow(); });

document.getElementById('BUTTON-toggle-map-window').addEventListener('click', function(e) { toggleMapWindow(); });
document.getElementById('BUTTON-close-map').addEventListener('click', function (e) { toggleMapWindow(); });

document.getElementById('BUTTON-toggle-atlas-window').addEventListener('click', function (e) { toggleAtlasWindow(); });

document.getElementById('BUTTON-share-location').addEventListener('click', function(e) { shareLocation(); });


function toggleCreditsWindow() {
	showCreditsWindow = !showCreditsWindow;
	document.getElementById('modal-credits').style.opacity = (showCreditsWindow ? 1 : 0);
	document.getElementById('modal-credits').style.pointerEvents = (showCreditsWindow ? 'auto' : 'none');
}


function toggleDebugWindow() {
	window.DEBUG_MODE = !window.DEBUG_MODE;
	document.getElementById('detailed-info').style.opacity = (window.DEBUG_MODE ? 1 : 0);
}

function toggleMapWindow() {
	showMapWindow = !showMapWindow;
	document.getElementById('modal-map').style.opacity = (showMapWindow ? 1 : 0);
	document.getElementById('modal-map').style.pointerEvents = (showMapWindow ? 'auto' : 'none');
	document.getElementById('map-window').style.transform = (showMapWindow ? 'scale(1)' : 'scale(0)');
}

function toggleAtlasWindow() {
	showAtlasWindow = !showAtlasWindow;

	if (showAtlasWindow) { 
		document.dispatchEvent(new CustomEvent('createAtlasScene'));
	}

	const atlasModal = document.getElementById('modal-atlas');
	const atlasContainer = document.getElementById('atlas-container');

	atlasModal.style.opacity = (showAtlasWindow ? 1 : 0);
	atlasModal.style.pointerEvents = (showAtlasWindow ? 'auto' : 'none');
	atlasContainer.style.transform = (showAtlasWindow ? 'scale(1)' : 'scale(0)');
}

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



function setLocation(locationName) {

	let result = window.LOCATIONS.filter(location => {
		return location.NAME === locationName;
	});

	if (result) {
		window.ACTIVE_LOCATION = result[0];
		saveSetting('activeLocation', window.ACTIVE_LOCATION.NAME);
		toggleSettingsWindow('off');

		window.suppressReload = true;
		parent.location.hash = getHashedLocation();
		setTimeout(() => {
			window.suppressReload = false;
		}, 1000)

		// toggleMessageBasedOnLocation();

		return true;

	} else {
		throw 'Invalid [locationName] parameter passed to [setLocation] function!\nValue passed: ' + locationName;
		return false;
	}
}

// function toggleMessageBasedOnLocation() {
// 	let msg = document.getElementById('message');
// 	msg.style.display = 'block';

// 	setText('message-title', 'Data may be inaccurate');
// 	setText('message-text', 'Location updated for Alpha 3.20 - testing in progress.');
// 	msg.style.backgroundColor = 'hsla(040, 80%, 30%, 0.70)';

// }



function populateLocationList() {
	let container = document.getElementById('available-locations-list');

	for (let loc of window.LOCATIONS) {
		if (loc.PARENT?.TYPE === 'Lagrange Point') continue;

		let el = document.createElement('div');
		el.className = 'BUTTON-set-location';
		el.addEventListener('click', function(e) { setLocation(loc.NAME); });
		el.dataset.locationName = loc.NAME;

		let elName = document.createElement('p');
		elName.className = 'set-location-name';
		elName.innerHTML = loc.NAME;

		let elBody = document.createElement('p');
		elBody.className = 'set-location-body';
		elBody.innerHTML = loc.PARENT.NAME;

		let elTime = document.createElement('p');
		elTime.className = 'set-location-time';
		elTime.innerHTML = 'XX:XX';

		el.appendChild(elName);
		el.appendChild(elBody);
		el.appendChild(elTime);
		container.appendChild(el);
	}
}


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




// KEYBOARD INPUT
document.addEventListener('keydown', function(event){
	if (event.key === 'Escape') {
		if (showSettingsWindow) toggleSettingsWindow();
		if (showCreditsWindow) toggleCreditsWindow();
		if (showAtlasWindow) toggleAtlasWindow();
		if (showMapWindow) toggleMapWindow();
		if (window.DEBUG_MODE) toggleDebugWindow();
	}


	if (event.target.tagName.toLowerCase() === 'input') { return; }

	if (event.keyCode === 65) { toggleAtlasWindow(); }

	if (event.keyCode === 68) { toggleDebugWindow(); }

	if (event.keyCode === 77) {
		document.getElementById('BUTTON-toggle-map-window').click();
	}
	
	if (event.keyCode === 84) {
		window.SETTING_24HR = !window.SETTING_24HR;
		saveSetting('time24', window.SETTING_24HR);
	}

	if (event.keyCode === 191) {
		toggleSettingsWindow('on');
		document.getElementById('location-selection-input').blur();
	}
});



function showMapLocationData(location, triggerElement) {
	hoverLocation = location;

	document.getElementById('map-locationinfo-window').style.opacity = 1;

	setText('map-info-locationname', location.NAME);
	setText('map-info-locationtype', location.TYPE);
	setText('map-info-elevation', Math.round(location.ELEVATION * 1000, 1).toLocaleString());
	setText('map-info-phase', location.ILLUMINATION_STATUS);
	updateHoverLocationNextRiseAndSet();
}

setInterval(updateMapLocationData, 250);
function updateMapLocationData() {
	if (!hoverLocation) return;
	setText('map-info-phase', hoverLocation.ILLUMINATION_STATUS);
	updateHoverLocationNextRiseAndSet();
}

function updateHoverLocationNextRiseAndSet() {
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

	setText('map-info-nextstarrise', nextRise);
	setText('map-info-nextstarset', nextSet);
}


function hideMapLocationData() {
	document.getElementById('map-locationinfo-window').style.opacity = 0;
	hoverLocation = null;
}