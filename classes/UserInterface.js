let showAtlasWindow = false;
let showMapWindow = false;
let showDebugWindow = false;
let showSettingsWindow = false;
let showCreditsWindow = false;

class UserInterface {
    constructor() {
        if (UserInterface.instance) return UserInterface.instance;
		UserInterface.instance = this;
		this.setupEventListeners();
	}

	setupEventListeners() {
		// CLICKS
		this.el('BUTTON-toggle-atlas-window').addEventListener('click', () => this.toggleAtlasWindow());

		this.el('BUTTON-toggle-map-window').addEventListener('click', () => this.toggleMapWindow());
		this.el('BUTTON-close-map').addEventListener('click', () => this.toggleMapWindow());

		this.el('BUTTON-open-settings').addEventListener('click', this.toggleSettingsWindow);
		this.el('BUTTON-close-settings').addEventListener('click', this.toggleSettingsWindow);

		this.el('BUTTON-toggle-credits-window').addEventListener('click', this.toggleCreditsWindow);
		this.el('BUTTON-close-credits').addEventListener('click', this.toggleCreditsWindow);


		// KEYBOARD
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				//if (showCreditsWindow) toggleCreditsWindow();
				if (UI.showAtlasWindow) UI.toggleAtlasWindow();
				if (UI.showMapWindow) UI.toggleMapWindow();
				if (UI.showDebugWindow) UI.toggleDebugWindow();
				if (UI.showSettingsWindow) UI.toggleSettingsWindow();

				return;
			}

			if (event.target.tagName.toLowerCase() === 'input') return;


			if (event.key === 'a') { UI.toggleAtlasWindow(); }
			if (event.key === 'm') { UI.toggleMapWindow(); }
			if (event.key === 'd') { UI.toggleDebugWindow(); }


			//if (event.key === 't') {
			//	window.SETTING_24HR = !window.SETTING_24HR;
			//	saveSetting('time24', window.SETTING_24HR);
			//}

			if (event.key === '/') {
				UI.toggleSettingsWindow('on');
				UI.el('location-selection-input').blur();
			}
		});
	}

	setText(elementID, string) {
		let el = (typeof elementID === 'string') ? document.getElementById(elementID) : elementID;

		if (!el) {
			console.error('Element not found:', elementID);
			return null;
		}

		if (el.textContent !== string) el.textContent = string;
	}

	el(idString) {
		let el = document.getElementById(idString);

		if (!el) {
			console.error('Element not found:', idString);
			return null;
		}

		return el;
	}

	toggleAtlasWindow() {
		UI.showAtlasWindow = !UI.showAtlasWindow;

		if (UI.showAtlasWindow) {
			document.dispatchEvent(new CustomEvent('createAtlasScene'));
		}

		const atlasModal = UI.el('modal-atlas');
		const atlasContainer = UI.el('atlas-container');

		atlasModal.style.opacity = UI.showAtlasWindow ? 1 : 0;
		atlasModal.style.pointerEvents = (UI.showAtlasWindow ? 'auto' : 'none');
		atlasContainer.style.transform = (UI.showAtlasWindow ? 'scale(1)' : 'scale(0)');
	}

	toggleMapWindow() {
		UI.showMapWindow = !UI.showMapWindow;

		if (UI.showMapWindow) {
			document.dispatchEvent(new CustomEvent('createMapScene'));
		}

		const mapModal = UI.el('modal-map');
		const mapContainer = UI.el('map-window');

		mapModal.style.opacity = (UI.showMapWindow ? 1 : 0);
		mapModal.style.pointerEvents = (UI.showMapWindow ? 'auto' : 'none');
		mapContainer.style.transform = (UI.showMapWindow ? 'scale(1)' : 'scale(0)');
	}

	toggleDebugWindow() {
		UI.showDebugWindow = !UI.showDebugWindow;
		UI.el('detailed-info').style.opacity = (UI.showDebugWindow ? 1 : 0);
	}

	toggleSettingsWindow() {
		UI.showSettingsWindow = !UI.showSettingsWindow;

		UI.el('modal-settings').style.opacity = (UI.showSettingsWindow ? 1 : 0);
		UI.el('modal-settings').style.pointerEvents = (UI.showSettingsWindow ? 'auto' : 'none');
		UI.el('settings-window').style.transform = (UI.showSettingsWindow ? 'scale(1)' : 'scale(0)');

		if (showSettingsWindow) {
			UI.el('location-selection-input').focus();
		} else {
			UI.el('location-selection-input').blur();
		}
	}

	toggleCreditsWindow() {
		UI.showCreditsWindow = !UI.showCreditsWindow;
		UI.el('modal-credits').style.opacity = (UI.showCreditsWindow ? 1 : 0);
		UI.el('modal-credits').style.pointerEvents = (UI.showCreditsWindow ? 'auto' : 'none');
	}

	setMapLocation(locationName) {
		const result = window.LOCATIONS.filter(location => {
			return location.NAME === locationName;
		});

		if (result.length > 0) {
			window.ACTIVE_LOCATION = result[0];
			saveSetting('activeLocation', window.ACTIVE_LOCATION.NAME);
			if (UI.showSettingsWindow) UI.toggleSettingsWindow();

			window.suppressReload = true;
			parent.location.hash = getHashedLocation();
			setTimeout(() => {
				window.suppressReload = false;
			}, 1000)

			return true;

		} else {
			console.error('Invalid [locationName] parameter passed to [setLocation] function!\nValue passed: ' + locationName);
			return false;
		}
	}

	populateLocationList() {
		let container = document.getElementById('available-locations-list');

		for (let loc of window.LOCATIONS) {
			if (loc.PARENT?.TYPE === 'Lagrange Point') continue;
			if (loc.TYPE === 'Asteroid cluster') continue;

			let el = document.createElement('div');
			el.className = 'BUTTON-set-location';
			el.addEventListener('click', function (e) { UI.setMapLocation(loc.NAME); });
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

}

const UI = new UserInterface();
export default UI;