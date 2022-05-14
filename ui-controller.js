let showSettingsWindow = false;
let showCretidsWindow = false;

document.getElementById('BUTTON-open-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });
document.getElementById('BUTTON-close-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });

function toggleSettingsWindow() {
	showSettingsWindow = !showSettingsWindow;
	document.getElementById('modal-settings').style.opacity = (showSettingsWindow ? 1 : 0);
	document.getElementById('modal-settings').style.pointerEvents = (showSettingsWindow ? 'auto' : 'none');
	// console.log('Settings window turned ' + (showSettingsWindow ? 'ON' : 'OFF'));
}


document.getElementById('BUTTON-toggle-credits-window').addEventListener('click', function(e) { toggleCreditsWindow(); });
document.getElementById('BUTTON-close-credits').addEventListener('click', function(e) { toggleCreditsWindow(); });

function toggleCreditsWindow() {
	showCretidsWindow = !showCretidsWindow;
	document.getElementById('modal-credits').style.opacity = (showCretidsWindow ? 1 : 0);
	document.getElementById('modal-credits').style.pointerEvents = (showCretidsWindow ? 'auto' : 'none');
}




let locationButtons = document.getElementsByClassName('BUTTON-set-location');

for (let element of locationButtons) {
	element.addEventListener('click', function(e) { setLocation(element.innerText); });
}

function setLocation(locationName) {

	let result = window.LOCATIONS.filter(location => {
		return location.NAME === locationName;
	});

	if (result) {
		window.ACTIVE_LOCATION = result[0];
		toggleSettingsWindow();

	} else {
		throw 'Invalid [locationName] parameter passed to [setLocation] function!\nValue passed ➤➤➤ ' + locationName;
	}
}






document.addEventListener('keydown', function(event){
	if (event.key === 'Escape') {
		if (showSettingsWindow) toggleSettingsWindow();
		if (showCretidsWindow) toggleCreditsWindow();
	}

	if (event.key === 'D') {
		window.DEBUG_MODE = !window.DEBUG_MODE;
	}
});