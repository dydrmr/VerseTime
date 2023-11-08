import { ROUND, CHOSEN_TIME } from './HelperFunctions.js';
import DB from './classes/Database.js';
import UI from './classes/UserInterface.js';

//import SolarSystem from './classes/SolarSystem.js';
//import CelestialBody from './classes/CelestialBody.js';
//import Location from './classes/Location.js';
//import Wormhole from './classes/Wormhole.js';

window.SYSTEMS = Array();
window.BODIES = Array();
window.LOCATIONS = Array();
window.WORMHOLES = Array();

window.ACTIVE_LOCATION = null;
window.SETTING_24HR = true;
//window.DEBUG_MODE = false;
window.HOURS_TO_TIME_STRING = HOURS_TO_TIME_STRING;
window.setText = setText;

window.suppressReload = false;
window.CHOSEN_TIME = 'now';


// FUNCTIONS
function checkHash() {
	let hash = window.location.hash;
	if (hash === '') return;

	let hashParts = hash.replace('#', '').replaceAll('_', ' ').split('@');

	const locationName = hashParts[0];
	const location = getLocationByName(locationName);

	if (hashParts[1] !== undefined) {
		setChosenTime(hashParts[1], true);
	}

	UI.setMapLocation(locationName);
}

function update() {

	if (window.LOCATIONS.length === 0) return;

	let location = window.ACTIVE_LOCATION;
	let body = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	const col = location.THEME_COLOR;
	const colorMain = `rgb(${col.r}, ${col.g}, ${col.b})`;
	const colorDark = `rgb(${col.r * 0.2}, ${col.g * 0.2}, ${col.b * 0.2})`;

	document.querySelector(':root').style.setProperty('--theme-color', colorMain);
	document.querySelector(':root').style.setProperty('--theme-color-dark', colorDark);

	const bg = UI.el('selected-location-bg-image');
	if (bg.backgroundColor !== colorMain) bg.backgroundColor = colorMain;

	const bgImage = `url('${location.THEME_IMAGE}')`;
	if (bg.style.backgroundImage !== bgImage) bg.style.backgroundImage = bgImage;


	// MAIN LOCATION INFO
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


	// RISE/SET COUNTDOWNS
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


	// RISE/SET LOCAL TIMES
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


	// RISE/SET REAL TIMES
	let now = CHOSEN_TIME();
	if (!nextRise) {
		UI.setText('next-rise-time', '---');
	} else {
		let rise = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 86400));
		// if (new Date(rise).getSeconds() === 59) {
		// 	rise = new Date(rise + 1000);
		// }
		UI.setText('next-rise-time', DATE_TO_SHORT_TIME(new Date(rise)));
	}

	now = CHOSEN_TIME();
	if (!nextSet) {
		UI.setText('next-set-time', '---');
	} else {
		let set = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 86400));
		// if (new Date(set).getSeconds() === 59) {
		// 	set = new Date(set.getTime() + 1000);
		// }
		UI.setText('next-set-time', DATE_TO_SHORT_TIME(new Date(set)));
	}


	// ILLUMINATION STATUS & IN-LORE CALENDAR DATE
	let scDate = CHOSEN_TIME();
	scDate.setFullYear(scDate.getFullYear() + 930);
	let scDateString = scDate.toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric' });

	UI.setText('illumination-status', location.ILLUMINATION_STATUS + '\r\n' + scDateString);


	if (UI.showSettingsWindow) updateSettingsLocationTimes();
	if (UI.showDebugWindow) updateDebugUI();
}

function updateDebugUI() {
	let loc = window.ACTIVE_LOCATION;
	let bod = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	UI.setText('db-hash', window.location.hash);

	// CLOCKS
	let unix = Math.floor(CHOSEN_TIME().valueOf() / 1000);
	UI.setText('db-unix-time', unix.toLocaleString());
	UI.setText('db-chosen-time', CHOSEN_TIME().toUTCString());
	UI.setText('db-gmt-time', new Date().toUTCString());
	UI.setText('db-universe-time', UNIVERSE_TIME(true).replace('GMT', 'SET'));

	//CELESTIAL BODY
	if (bod) {
		UI.setText('body-name', bod.NAME);
		UI.setText('body-type', bod.TYPE);
		UI.setText('body-system', bod.PARENT_STAR.NAME);
		UI.setText('body-parent-name', bod.PARENT.NAME);
		UI.setText('body-radius', bod.BODY_RADIUS.toLocaleString());
		UI.setText('day-length', (bod.ROTATION_RATE * 60 * 60).toLocaleString());
		UI.setText('day-length-readable', HOURS_TO_TIME_STRING(bod.ROTATION_RATE));
		UI.setText('hour-length-readable', HOURS_TO_TIME_STRING(bod.ROTATION_RATE / 24));
		UI.setText('current-cycle', ROUND(bod.CURRENT_CYCLE(), 3).toLocaleString());
		UI.setText('hour-angle', bod.HOUR_ANGLE().toFixed(3));
		UI.setText('declination', bod.DECLINATION(bod.PARENT_STAR).toFixed(3));
		UI.setText('meridian', bod.MERIDIAN().toFixed(3));
		UI.setText('noon-longitude', bod.LONGITUDE().toFixed(3));
	}

	//LOCATION
	UI.setText('db-local-name', loc.NAME);
	UI.setText('db-local-time', HOURS_TO_TIME_STRING(loc.LOCAL_TIME / 60 / 60));

	let latitude = loc.LATITUDE.toFixed(3);
	if (parseFloat(latitude) < 0) {
		latitude = 'S ' + (parseFloat(latitude) * -1).toFixed(3);
	} else {
		latitude = 'N ' + latitude;
	}
	UI.setText('latitude', latitude);

	let longitude = loc.LONGITUDE.toFixed(3);
	if (parseFloat(longitude) < 0) {
		longitude = 'W ' + (parseFloat(longitude) * -1).toFixed(3);
	} else {
		longitude = 'E ' + longitude;
	}
	UI.setText('longitude', longitude);

	UI.setText('longitude-360', ROUND(loc.LONGITUDE_360, 3));
	UI.setText('elevation', ROUND(loc.ELEVATION * 1000, 1).toLocaleString());
	UI.setText('elevation-degrees', loc.ELEVATION_IN_DEGREES.toFixed(3));
	UI.setText('sunriseset-angle', loc.STARRISE_AND_STARSET_ANGLE.toFixed(3));
	UI.setText('length-of-daylight', HOURS_TO_TIME_STRING(loc.LENGTH_OF_DAYLIGHT * 24, true, false));
	UI.setText('length-of-night', HOURS_TO_TIME_STRING((bod.ROTATION_RATE) - (loc.LENGTH_OF_DAYLIGHT * 24), true, false));
	UI.setText('starrise-time', HOURS_TO_TIME_STRING(loc.LOCAL_STAR_RISE_TIME * 24));
	UI.setText('starset-time', HOURS_TO_TIME_STRING(loc.LOCAL_STAR_SET_TIME * 24));
	UI.setText('next-starrise-countdown', ROUND(parseFloat(loc.NEXT_STAR_RISE), 6).toFixed(6));
	UI.setText('next-starset-countdown', ROUND(parseFloat(loc.NEXT_STAR_SET), 6).toFixed(6));
	UI.setText('db-illumination-status', loc.ILLUMINATION_STATUS);
	UI.setText('hour-angle-location', loc.HOUR_ANGLE().toFixed(3));
	UI.setText('star-azimuth', loc.STAR_AZIMUTH().toFixed(3));
	UI.setText('star-altitude', loc.STAR_ALTITUDE().toFixed(3));
	UI.setText('max-star-altitude', loc.STAR_MAX_ALTITUDE().toFixed(3));

	let now = CHOSEN_TIME();
	now.setMilliseconds(0);
	let next = now.setSeconds(now.getSeconds() + (loc.NEXT_STAR_RISE * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	let remain = HOURS_TO_TIME_STRING(loc.NEXT_STAR_RISE * 24, true, false);
	UI.setText('db-next-starrise', (loc.NEXT_STAR_RISE * 24 * 60 * 60).toFixed(0));
	UI.setText('db-next-starrise-countdown', remain);
	UI.setText('db-next-starrise-date', next);

	now = CHOSEN_TIME();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (loc.NEXT_NOON * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(loc.NEXT_NOON * 24, true, false);
	UI.setText('next-noon', (loc.NEXT_NOON * 24 * 60 * 60).toFixed(0));
	UI.setText('next-noon-countdown', remain);
	UI.setText('next-noon-date', next);

	now = CHOSEN_TIME();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (loc.NEXT_STAR_SET * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(loc.NEXT_STAR_SET * 24, true, false);
	UI.setText('db-next-starset', (loc.NEXT_STAR_SET * 24 * 60 * 60).toFixed(0));
	UI.setText('db-next-starset-countdown', remain);
	UI.setText('db-next-starset-date', next);
}

function updateSettingsLocationTimes() {
	let buttons = document.getElementsByClassName('BUTTON-set-location');

	for (let element of buttons) {
		let timeElement = element.querySelector('.set-location-time');
		let locationName = element.dataset.locationName;

		let location = window.LOCATIONS.filter(location => {
			return location.NAME === locationName;
		})[0];

		let string = '';
		if (String(location.LOCAL_TIME) === 'NaN') {
			string = location.ILLUMINATION_STATUS;
		} else {
			string = HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false, true) + '\r\n' + location.ILLUMINATION_STATUS;
		}

		UI.setText(timeElement, string);
	}
}

// LEGACY IMPLEMENTATION; FIND REMAINING CALLS
function setText(elementID, string) {
	console.warn('Used old setText function!');

	let el = (typeof elementID === 'string') ? document.getElementById(elementID) : elementID;

	if (!el) {
		console.error('Element not found:', elementID);
		return null;
	}

	if (el.textContent !== string) el.textContent = string;
}

function REAL_TIME(formatAsString = false) {
	let now = new Date();
	return (!formatAsString) ? now.valueOf() : now.toLocaleString();
}

function UNIVERSE_TIME(formatAsString = false) {
	let date2020 = new Date('January 1, 2020 00:00:00Z');
	let date2950 = new Date('January 1, 2950 00:00:00Z');
	let universeTime = date2950.getTime() + ((CHOSEN_TIME() - date2020) * 6);
	return (!formatAsString) ? universeTime : new Date(universeTime).toUTCString();
}

function HOURS_TO_TIME_STRING(hours, includeSeconds = true, limitTo24Hours = true) {
	if (hours < 0) return '- NEGATIVE -';

	let h = hours;
	let m = (h - Math.floor(h)) * 60;
	let s = (m - Math.floor(m)) * 60;

	s = Math.round(s);
	if (s >= 60) {
		s -= 60;
		m += 1;
	}

	m = Math.floor(m);
	if (m >= 60) {
		m -= 60;
		h += 1;
	}

	h = Math.floor(h);
	if (limitTo24Hours) {
		while (h >= 24) h -= 24;
	}

	let ampm = '';
	if (limitTo24Hours && !window.SETTING_24HR) {
		ampm = ' ' + GET_AM_PM(h);
		h = CONVERT_24H_TO_12H(h);
	}

	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;
	s = (s < 10) ? '0' + s : s;

	return h + ':' + m + (includeSeconds ? ':' + s : '') + ampm;
}

function DATE_TO_SHORT_TIME(date) {
	let h = date.getHours();
	let m = date.getMinutes();

	let ampm = '';
	if (!window.SETTING_24HR) {
		ampm = ' ' + GET_AM_PM(h);
		h = CONVERT_24H_TO_12H(h);
	}

	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;

	return h + ':' + m + ampm;
}

function GET_AM_PM(hour) { return (hour < 12) ? 'am' : 'pm'; }
function CONVERT_24H_TO_12H(hour) {
	if (hour > 12) hour -= 12;
	if (hour === 0) hour = 12;
	return hour;
}


function getSystemByName(string) {
	const result = window.SYSTEMS.filter(sys => sys.NAME === string);

	if (result.length === 0) {
		console.error(`System "${string} not found."`);
		return null;
	}

	return result[0];
}
window.getSystemByName = getSystemByName;

function getBodyByName(string) {
	const result = window.BODIES.filter(bod => bod.NAME === string);

	if (result.length === 0) {
		console.error(`Body "${string}" not found.`);
		return null;
	}

	return result[0];
}
window.getBodyByName = getBodyByName;

function getLocationByName(string) {
	const result = window.LOCATIONS.filter(loc => loc.NAME === string);

	if (result.length === 0) {
		console.error(`Location "${string}" not found.`);
		return null;
	}

	return result[0];
}
window.getLocationByName = getLocationByName;




// INIT
async function startVerseTime() {
	await DB.createDatabase();
	window.LOCATIONS.sort((a, b) => a.NAME.localeCompare(b.NAME));
	UI.populateLocationList();
	checkHash();
	loadSettings();
	setInterval(update, 250);
	update();
}
startVerseTime();


window.addEventListener('hashchange', () => {
	if (window.suppressReload) return;
	window.location.reload(true);
}, false);
