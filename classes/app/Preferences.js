import DB from './Database.js';
import UI from './UserInterface.js';

// TODO
// migrate custom time

class Preferences {
    constructor() {
        if (Preferences.instance) return Preferences.instance;
		Preferences.instance = this;

		this.use24HourTime = true;
		this.activeLocation = null;
		this.customTime = 'now';
    }

    load() {
		const savedActiveLocation = String(window.localStorage.getItem('activeLocation'));
		const time24 = window.localStorage.getItem('time24');

		const mapPlanetTransparency = window.localStorage.getItem('mapPlanetTransparency');
		const mapGrid = window.localStorage.getItem('mapGrid');
		const mapTerminator = window.localStorage.getItem('mapTerminator');
		const mapOMs = window.localStorage.getItem('mapOMs');
		const mapTimes = window.localStorage.getItem('mapTimes');
		const mapStars = window.localStorage.getItem('mapStars');


		if (window.location.hash === '' && savedActiveLocation !== 'null') {
			const result = UI.setMapLocation(savedActiveLocation);
			if (!result) Settings.#setDefaultLocation();

		} else if (window.location.hash === '') {
			Settings.#setDefaultLocation();
		}

		if (time24) {
			Settings.use24HourTime = (time24 === 'false') ? false : true;
		} else {
			Settings.use24HourTime = true;
		}

		// LOCAL MAP
		if (mapPlanetTransparency) {
			UI.el('map-settings-planet-transparency').value = parseInt(mapPlanetTransparency);
		}

		if (mapGrid) {
			UI.el('map-settings-show-grid').checked = (mapGrid === 'false') ? false : true;
		}

		if (mapTerminator) {
			UI.el('map-settings-show-terminator').checked = (mapTerminator === 'false') ? false : true;
		}

		if (mapOMs) {
			UI.el('map-settings-show-orbitalmarkers').checked = (mapOMs === 'false') ? false : true;
		}

		if (mapTimes) {
			UI.el('map-settings-show-times').checked = (mapTimes === 'false') ? false : true;
		}

		if (mapStars) {
			UI.el('map-settings-show-starfield').checked = (mapStars === 'false') ? false : true;
		}

		// ATLAS
		// TODO...
	}

	#setDefaultLocation() {
		let result = DB.locations.filter(location => {
			return location.NAME === 'Orison';
		});
		Settings.activeLocation = result[0];
	}

	save(key, value) {
		window.localStorage.setItem(key, value);
	}
}

const Settings = new Preferences();
export default Settings;