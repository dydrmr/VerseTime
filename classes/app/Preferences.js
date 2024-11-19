import CelestialBody from '../CelestialBody.js';
import DB from './Database.js';
import UI from './UserInterface.js';

class Preferences {
    constructor() {
        if (Preferences.instance) return Preferences.instance;
		Preferences.instance = this;

		this.use24HourTime = true;
		this.activeLocation = null;
		this.customTime = 'now';
		this.useHdTextures = true;
    }

    load() {
		const savedActiveLocation = String(window.localStorage.getItem('activeLocation'));
		if (window.location.hash === '' && savedActiveLocation !== 'null') {
			const result = UI.setMapLocation(savedActiveLocation);
			if (!result) Settings.#setDefaultLocation();

		} else if (window.location.hash === '') {
			Settings.#setDefaultLocation();
		}

		const time24 = window.localStorage.getItem('time24');
		if (time24) {
			Settings.use24HourTime = (time24 === 'false') ? false : true;
		} else {
			Settings.use24HourTime = true;
		}

		const hdTextures = window.localStorage.getItem('hdTextures');
		if (hdTextures) {
			Settings.useHdTextures = (hdTextures === 'false') ? false : true;
		} else {
			Settings.useHdTextures = true;
		}

		// LOCAL MAP
		const mapPlanetTransparency = window.localStorage.getItem('mapPlanetTransparency');
		const mapGrid = window.localStorage.getItem('mapGrid');
		const mapTerminator = window.localStorage.getItem('mapTerminator');
		const mapOMs = window.localStorage.getItem('mapOMs');
		const mapTimes = window.localStorage.getItem('mapTimes');
		const mapStars = window.localStorage.getItem('mapStars');

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
		const atlasLolli = window.localStorage.getItem('atlasLollipops');
		const atlasWorm = window.localStorage.getItem('atlasWormholes');
		const atlasAffil = window.localStorage.getItem('atlasAffiliation');
		const atlasGrid = window.localStorage.getItem('atlasGrid');

		if (atlasLolli) {
			UI.el('atlas-settings-show-lollipops').checked = (atlasLolli === 'false') ? false : true;
		}

		if (atlasWorm) {
			UI.el('atlas-settings-show-wormholes').checked = (atlasWorm === 'false') ? false : true;
		}

		if (atlasAffil) {
			UI.el('atlas-settings-show-affiliation').checked = (atlasAffil === 'false') ? false : true;
		}

		if (atlasGrid) {
			UI.el('atlas-settings-show-grid').checked = (atlasGrid === 'false') ? false : true;
		}
	}

	#setDefaultLocation() {
		let result = DB.locations.filter(location => {
			return location.NAME === 'Orison';
		});
		Settings.activeLocation = result[0];
		Settings.save('activeLocation', result[0].NAME);
	}

	save(key, value) {
		window.localStorage.setItem(key, value);
	}

	getCelestialBodyTexturePath(body) {
		if (!(body instanceof CelestialBody)) {
			console.error('Parameter is not of type CelestialBody:', body);
			return null;
		}

		const directory = Settings.useHdTextures ? 'bodies-hd' : 'bodies';
		return `textures/${directory}/${body.NAME.toLowerCase()}.webp`;
	}

	getCelestialBodyTexturePaths(body, forceLowResolution = false) {
		if (!(body instanceof CelestialBody)) {
			console.error('Parameter is not of type CelestialBody:', body);
			return null;
		}

		let mainTexture;
		if (forceLowResolution) {
			mainTexture = `textures/bodies/${body.NAME.toLowerCase()}.webp`;
		} else {
			mainTexture = this.getCelestialBodyTexturePath(body);
		}

		//const pathReflectCheck = `textures/bodies-reflection/${body.NAME.toLowerCase()}.webp`;
		//const reflectionFileExists = this.imageExists(pathReflectCheck);
		//const reflectTexture = reflectionFileExists ? pathReflectCheck : 'textures/bodies-reflection/no-reflection.webp';
		const reflectTexture = 'textures/bodies-reflection/no-reflection.webp';

		return {
			'main': mainTexture,
			'reflection': reflectTexture
		};
	}

	imageExists(image_url) {
		let http = new XMLHttpRequest();
		http.open('HEAD', image_url, false);
		try {
			http.send();
        } catch (e) {

        }
		return http.status != 404;
	}
}

const Settings = new Preferences();
export default Settings;