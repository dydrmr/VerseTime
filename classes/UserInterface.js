import { getHashedLocation, HOURS_TO_TIME_STRING, CHOSEN_TIME, DATE_TO_SHORT_TIME } from '../HelperFunctions.js';

class UserInterface {
    constructor() {
        if (UserInterface.instance) return UserInterface.instance;
		UserInterface.instance = this;

		this.showAtlasWindow = false;
		this.showMapWindow = false;
		this.showDebugWindow = false;
		this.showSettingsWindow = false;
		this.showCreditsWindow = false;

		this.mapHoverLocation = null;

		this.#setupEventListeners();
	}

	#setupEventListeners() {
		// CLICKS
		this.el('BUTTON-toggle-atlas-window').addEventListener('click', this.toggleAtlasWindow);

		this.el('BUTTON-toggle-map-window').addEventListener('click', this.toggleMapWindow);
		this.el('BUTTON-close-map').addEventListener('click', this.toggleMapWindow);

		this.el('BUTTON-open-settings').addEventListener('click', this.toggleSettingsWindow);
		this.el('BUTTON-close-settings').addEventListener('click', this.toggleSettingsWindow);

		this.el('BUTTON-toggle-credits-window').addEventListener('click', this.toggleCreditsWindow);
		this.el('BUTTON-close-credits').addEventListener('click', this.toggleCreditsWindow);

		this.el('BUTTON-share-location').addEventListener('click', this.shareLocation);


		// KEYBOARD
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				if (UI.showCreditsWindow) UI.toggleCreditsWindow();
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


			if (event.key === 't') {
				window.SETTING_24HR = !window.SETTING_24HR;
				saveSetting('time24', window.SETTING_24HR);
			}

			if (event.key === '/') {
				UI.toggleSettingsWindow('on');
				UI.el('location-selection-input').blur();
			}
		});


		// LIVE LOCATION FILTERING WHEN TYPING IN SEARCH BOX
		this.el('location-selection-input').addEventListener('input', (event) => {
			let search = this.el("location-selection-input").value.toLowerCase();
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
	}

	// MAIN UPDATE FUNCTION
	update(location) {
		UI.#update_setColors(location);
		UI.#update_setThemeImage(location);
		UI.#update_setLocationInfo(location);
		UI.#update_setRiseAndSetData(location);
		UI.#update_setIlluminationStatus(location);
	}

	#update_setColors(location) {
		const col = location.THEME_COLOR;
		const colorMain = `rgb(${col.r}, ${col.g}, ${col.b})`;
		const colorDark = `rgb(${col.r * 0.2}, ${col.g * 0.2}, ${col.b * 0.2})`;

		document.querySelector(':root').style.setProperty('--theme-color', colorMain);
		document.querySelector(':root').style.setProperty('--theme-color-dark', colorDark);

		const bg = UI.el('selected-location-bg-image');
		if (bg.backgroundColor !== colorMain) bg.backgroundColor = colorMain;
	}

	#update_setThemeImage(location) {
		const bg = UI.el('selected-location-bg-image');
		const bgImage = `url('${location.THEME_IMAGE}')`;
		if (bg.style.backgroundImage !== bgImage) bg.style.backgroundImage = bgImage;
	}

	#update_setLocationInfo(location) {
		if (
			location.ILLUMINATION_STATUS === 'Polar Day' ||
			location.ILLUMINATION_STATUS === 'Polar Night' ||
			location.LOCAL_TIME.toString() === 'NaN'
		) {
			UI.setText('local-time', location.ILLUMINATION_STATUS);
		} else {
			UI.setText('local-time', HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false));
		}
		if (window.CHOSEN_TIME != 'now') {
			UI.setText('chosen-time', CHOSEN_TIME().toLocaleString());
			UI.setText('chosen-time-sublabel', 'local selected time');
		} else {
			UI.setText('chosen-time', '');
			UI.setText('chosen-time-sublabel', '');
		}
		UI.setText('location-name', location.NAME);
		UI.setText('location-body-name', location.PARENT.NAME);
	}

	#update_setRiseAndSetData(location) {
		// COUNTDOWNS
		let nextRise = location.NEXT_STAR_RISE;
		if (!nextRise) {
			UI.setText('next-rise-countdown', '---');

		} else {
			nextRise = location.IS_STAR_RISING_NOW ? '- NOW -' : HOURS_TO_TIME_STRING(nextRise * 24, true, false);
			UI.setText('next-rise-countdown', nextRise);
		}

		let nextSet = location.NEXT_STAR_SET;
		if (!nextSet) {
			UI.setText('next-set-countdown', '---');

		} else {
			nextSet = location.IS_STAR_SETTING_NOW ? '- NOW -' : HOURS_TO_TIME_STRING(nextSet * 24, true, false);
			UI.setText('next-set-countdown', nextSet);
		}


		// LOCAL TIMES
		if (!nextRise) {
			UI.setText('local-rise-time', '---');
		} else {
			UI.setText('local-rise-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_RISE_TIME * 24, false, true));
		}

		if (!nextSet) {
			UI.setText('local-set-time', '---');
		} else {
			UI.setText('local-set-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_SET_TIME * 24, false, true));
		}


		// REAL TIMES
		let now = CHOSEN_TIME();
		if (!nextRise) {
			UI.setText('next-rise-time', '---');
		} else {
			const rise = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 86400));
			UI.setText('next-rise-time', DATE_TO_SHORT_TIME(new Date(rise)));
		}

		now = CHOSEN_TIME();
		if (!nextSet) {
			UI.setText('next-set-time', '---');
		} else {
			const set = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 86400));
			UI.setText('next-set-time', DATE_TO_SHORT_TIME(new Date(set)));
		}
	}

	#update_setIlluminationStatus(location) {
		let scDate = CHOSEN_TIME();
		scDate.setFullYear(scDate.getFullYear() + 930);
		let scDateString = scDate.toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric' });
		UI.setText('illumination-status', location.ILLUMINATION_STATUS + '\r\n' + scDateString);
	}


	// GLOBAL FUNCTIONS
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

	// TOGGLES
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

		if (UI.showSettingsWindow) {
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


	// SHARE LOCATION
	shareLocation() {
		const url = location.protocol + '//' + location.host + location.pathname + '#' + getHashedLocation();
		navigator.clipboard.writeText(url);

		const msg = UI.el('share-location-message');
		msg.style.transition = '0s ease-out';
		msg.style.opacity = 1;

		setTimeout(() => {
			msg.style.transition = '1s ease-out';
			msg.style.opacity = 0;
		}, 2000)
	}


	// FUNCTIONS FOR LOCAL MAP WINDOW
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

	showMapLocationData(location, triggerElement) {
		UI.mapHoverLocation = location;

		document.getElementById('map-locationinfo-window').style.opacity = 1;

		UI.setText('map-info-locationname', location.NAME);
		UI.setText('map-info-locationtype', location.TYPE);
		UI.setText('map-info-elevation', Math.round(location.ELEVATION * 1000, 1).toLocaleString());
		UI.#updateMapLocationData();
		setInterval(UI.#updateMapLocationData, 250);
	}

	#updateMapLocationData() {
		if (!UI.mapHoverLocation) return;
		UI.setText('map-info-phase', UI.mapHoverLocation.ILLUMINATION_STATUS);

		let nextRise, nextSet;

		const unchanging = ['Polar Day', 'Polar Night', 'Permanent Day', 'Permanent Night'];
		if (unchanging.includes(UI.mapHoverLocation.ILLUMINATION_STATUS)) {
			nextRise = '---';
			nextSet = '---';

		} else {

			if (UI.mapHoverLocation.IS_STAR_RISING_NOW) {
				nextRise = '- NOW -';
			} else {
				nextRise = HOURS_TO_TIME_STRING(UI.mapHoverLocation.NEXT_STAR_RISE * 24, true, false);
			}

			if (UI.mapHoverLocation.IS_STAR_SETTING_NOW) {
				nextSet = '- NOW -';
			} else {
				nextSet = HOURS_TO_TIME_STRING(UI.mapHoverLocation.NEXT_STAR_SET * 24, true, false);
			}

		}

		UI.setText('map-info-nextstarrise', nextRise);
		UI.setText('map-info-nextstarset', nextSet);
	}

	hideMapLocationData() {
		UI.el('map-locationinfo-window').style.opacity = 0;
		UI.mapHoverLocation = null;
		clearInterval(UI.#updateMapLocationData);
	}
}

const UI = new UserInterface();
export default UI;