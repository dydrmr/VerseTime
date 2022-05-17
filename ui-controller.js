let showSettingsWindow = false;
let showCreditsWindow = false;

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
	
	// console.log('Settings window turned ' + (showSettingsWindow ? 'ON' : 'OFF'));
}


document.getElementById('BUTTON-toggle-credits-window').addEventListener('click', function(e) { toggleCreditsWindow(); });
document.getElementById('BUTTON-close-credits').addEventListener('click', function(e) { toggleCreditsWindow(); });

function toggleCreditsWindow() {
	showCreditsWindow = !showCreditsWindow;
	document.getElementById('modal-credits').style.opacity = (showCreditsWindow ? 1 : 0);
	document.getElementById('modal-credits').style.pointerEvents = (showCreditsWindow ? 'auto' : 'none');
}


function toggleDebugWindow() {
	window.DEBUG_MODE = !window.DEBUG_MODE;
	document.getElementById('detailed-info').style.opacity = (window.DEBUG_MODE ? 1 : 0);
}






function setLocation(locationName) {

	let result = window.LOCATIONS.filter(location => {
		return location.NAME === locationName;
	});

	if (result) {
		window.ACTIVE_LOCATION = result[0];
		saveSetting('activeLocation', window.ACTIVE_LOCATION.NAME);
		toggleSettingsWindow('off');
		return true;

	} else {
		throw 'Invalid [locationName] parameter passed to [setLocation] function!\nValue passed ➤ ' + locationName;
		return false;
	}
}



function populateLocationGrid() {
	let container = document.getElementById('available-locations-grid');

	LOCATIONS.sort((a, b) => a.NAME.localeCompare(b.NAME));

	for (let l of window.LOCATIONS) {
		let el = document.createElement('div');
		el.innerHTML = l.NAME + '<br><span style="font-weight:normal;font-size:70%">' + l.PARENT.NAME + '</span>';
		el.className = 'BUTTON-set-location';
		el.addEventListener('click', function(e) { setLocation(l.NAME); });
		container.appendChild(el);
	}
}


// LOCATION SEARCH FILTER
document.getElementById('location-selection-input').addEventListener('input', (event) => { 
	let search = document.getElementById("location-selection-input").value.toLowerCase();
	let buttons = document.getElementsByClassName('BUTTON-set-location');

	for (let element of buttons) {

		if (search === '') {
			element.classList.remove('hide');
			continue;
		}

		if (element.innerText.toLowerCase().includes(search)) {
			element.classList.remove('hide');
		} else {
			element.classList.add('hide');
		}
	}
});




// KEYBOARD INPUT
document.addEventListener('keydown', function(event){
	if (event.key === 'Escape') {
		if (showSettingsWindow) toggleSettingsWindow();
		if (showCreditsWindow) toggleCreditsWindow();
		if (window.DEBUG_MODE) toggleDebugWindow();
	}


	if (event.target.tagName.toLowerCase() === 'input') { return; }


	if (event.keyCode === 68) { toggleDebugWindow(); }
	
	if (event.keyCode === 84) {
		window.SETTING_24HR = !window.SETTING_24HR;
		saveSetting('time24', window.SETTING_24HR);
	}
});