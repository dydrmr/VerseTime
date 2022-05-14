let showSettingsWindow = false;

document.getElementById('BUTTON-open-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });
document.getElementById('BUTTON-close-settings').addEventListener('click', function(e) { toggleSettingsWindow(); });

function toggleSettingsWindow() {
	showSettingsWindow = !showSettingsWindow;

	document.getElementById('modal').style.opacity = (showSettingsWindow ? 1 : 0);
	document.getElementById('modal').style.pointerEvents = (showSettingsWindow ? 'auto' : 'none');
	document.getElementById('settings-window').style.opacity = (showSettingsWindow ? 1 : 0);

	// console.log('Settings window turned ' + (showSettingsWindow ? 'ON' : 'OFF'));
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