import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE } from './HelperFunctions.js';
import CelestialBody from './CelestialBody.js';
import Location from './Location.js';


window.BODIES = Array();
window.LOCATIONS = Array();
window.ACTIVE_LOCATION = null;
window.SETTING_24HR = true;
window.DEBUG_MODE = false;
window.HOURS_TO_TIME_STRING = HOURS_TO_TIME_STRING;
window.setText = setText;

window.suppressReload = false;



// FUNCTIONS
function checkHash() {
	let hash = window.location.hash;
	if (hash === '') return;

	let locationName = hash.replace('#', '').replaceAll('_', ' ');
	let location = LOCATIONS.filter(loc => loc.NAME === locationName);

	if (location.length === 0) return;
	setLocation(locationName);
}

function update() {

	let location = window.ACTIVE_LOCATION;
	let body = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	let col = location.THEME_COLOR;
	document.querySelector(':root').style.setProperty('--theme-color', `rgb(${col.r}, ${col.g}, ${col.b})`);
	document.querySelector(':root').style.setProperty('--theme-color-dark', `rgb(${col.r*0.2}, ${col.g*0.2}, ${col.b*0.2})`);
	document.getElementById('selected-location-bg-image').backgroundColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
	document.getElementById('selected-location-bg-image').style.backgroundImage = `url('${location.THEME_IMAGE}')`;


	// MAIN LOCATION INFO
	if (
		location.ILLUMINATION_STATUS === 'Polar Day' ||
		location.ILLUMINATION_STATUS === 'Polar Night' ||
		location.LOCAL_TIME.toString() === 'NaN'
	) {
		setText('local-time', location.ILLUMINATION_STATUS);
	} else {
		setText('local-time', HOURS_TO_TIME_STRING(location.LOCAL_TIME/60/60, false));
	}
	setText('location-name', location.NAME);
	setText('location-body-name', location.PARENT.NAME);


	// RISE/SET COUNTDOWNS
	let nextRise = location.NEXT_STAR_RISE;
	if (!nextRise) {
		setText('next-rise-countdown', '---');

	} else {
		nextRise = location.IS_STAR_RISING_NOW ? '- NOW -' : HOURS_TO_TIME_STRING(nextRise * 24, true, false);
		setText('next-rise-countdown', nextRise);
	}

	let nextSet = location.NEXT_STAR_SET;
	if (!nextSet) {
		setText('next-set-countdown', '---');

	} else {
		nextSet = location.IS_STAR_SETTING_NOW ? '- NOW -' : HOURS_TO_TIME_STRING(nextSet * 24, true, false);
		setText('next-set-countdown', nextSet);
	}


	// RISE/SET LOCAL TIMES
	if (!nextRise) {
		setText('local-rise-time', '---');
	} else {
		setText('local-rise-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_RISE_TIME * 24, false, true));
	}

	if (!nextSet) {
		setText('local-set-time', '---');
	} else {
		setText('local-set-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_SET_TIME * 24, false, true));
	}


	// RISE/SET REAL TIMES
	let now = new Date();
	if (!nextRise) {
		setText('next-rise-time', '---');
	} else {
		let rise = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 86400));
		// if (new Date(rise).getSeconds() === 59) {
		// 	rise = new Date(rise + 1000);
		// }
		setText('next-rise-time', DATE_TO_SHORT_TIME(new Date(rise)));
	}

	now = new Date();
	if (!nextSet) {
		setText('next-set-time', '---');
	} else {
		let set = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 86400));
		// if (new Date(set).getSeconds() === 59) {
		// 	set = new Date(set.getTime() + 1000);
		// }
		setText('next-set-time', DATE_TO_SHORT_TIME(new Date(set)));
	}


	// ILLUMINATION STATUS & IN-LORE CALENDAR DATE
	let scDate = new Date();
	scDate.setFullYear(scDate.getFullYear() + 930);
	let scDateString = scDate.toLocaleString('default', {year: 'numeric', month: 'long', day: 'numeric'});

	setText('illumination-status', location.ILLUMINATION_STATUS + '\r\n' + scDateString);


	if (showSettingsWindow) updateSettingsLocationTimes();
	if (window.DEBUG_MODE) updateDebugUI();	
}

function updateDebugUI() {
	let loc = window.ACTIVE_LOCATION;
	let bod = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	// CLOCKS
	let unix = Math.floor(REAL_TIME() / 1000);
	setText('db-unix-time', unix.toLocaleString());
	setText('db-gmt-time', new Date().toUTCString());
	setText('db-universe-time', UNIVERSE_TIME(true).replace('GMT', 'SET'));

	//CELESTIAL BODY
	if (bod) {
		setText('body-name', bod.NAME);
		setText('body-type', bod.TYPE);
		setText('body-system', bod.PARENT_STAR.NAME);
		setText('body-parent-name', bod.PARENT.NAME);
		setText('body-radius', bod.BODY_RADIUS.toLocaleString());
		setText('day-length', (bod.ROTATION_RATE*60*60).toLocaleString());
		setText('day-length-readable', HOURS_TO_TIME_STRING(bod.ROTATION_RATE));
		setText('hour-length-readable', HOURS_TO_TIME_STRING(bod.ROTATION_RATE / 24));
		setText('current-cycle', ROUND(bod.CURRENT_CYCLE(), 3).toLocaleString());
		setText('hour-angle', bod.HOUR_ANGLE().toFixed(3));
		setText('declination', bod.DECLINATION(bod.PARENT_STAR).toFixed(3));
		setText('meridian', bod.MERIDIAN().toFixed(3));
		setText('noon-longitude', bod.LONGITUDE().toFixed(3));
	}

	//LOCATION
	setText('db-local-name', loc.NAME);
	setText('db-local-time', HOURS_TO_TIME_STRING(loc.LOCAL_TIME/60/60));

	let latitude = loc.LATITUDE.toFixed(3);
	if (parseFloat(latitude) < 0) {
		latitude = 'S ' + (parseFloat(latitude) * -1).toFixed(3);
	} else {
		latitude = 'N ' + latitude;
	}
	setText('latitude', latitude);

	let longitude = loc.LONGITUDE.toFixed(3);
	if (parseFloat(longitude) < 0) {
		longitude = 'W ' + (parseFloat(longitude) * -1).toFixed(3);
	} else {
		longitude = 'E ' + longitude;
	}
	setText('longitude', longitude);
	
	setText('longitude-360', ROUND(loc.LONGITUDE_360, 3));
	setText('elevation', ROUND(loc.ELEVATION * 1000, 1).toLocaleString());
	setText('elevation-degrees', loc.ELEVATION_IN_DEGREES.toFixed(3));
	setText('sunriseset-angle', loc.STARRISE_AND_STARSET_ANGLE.toFixed(3));
	setText('length-of-daylight', HOURS_TO_TIME_STRING(loc.LENGTH_OF_DAYLIGHT * 24, true, false));
	setText('length-of-night', HOURS_TO_TIME_STRING((bod.ROTATION_RATE) - (loc.LENGTH_OF_DAYLIGHT *24), true, false));
	setText('starrise-time', HOURS_TO_TIME_STRING(loc.LOCAL_STAR_RISE_TIME*24));
	setText('starset-time', HOURS_TO_TIME_STRING(loc.LOCAL_STAR_SET_TIME*24));
	setText('next-starrise-countdown', ROUND(parseFloat(loc.NEXT_STAR_RISE), 6).toFixed(6));
	setText('next-starset-countdown', ROUND(parseFloat(loc.NEXT_STAR_SET), 6).toFixed(6));
	setText('db-illumination-status', loc.ILLUMINATION_STATUS);
	setText('hour-angle-location', loc.HOUR_ANGLE().toFixed(3));
	setText('star-azimuth', loc.STAR_AZIMUTH().toFixed(3));
	setText('star-altitude', loc.STAR_ALTITUDE().toFixed(3));
	setText('max-star-altitude', loc.STAR_MAX_ALTITUDE().toFixed(3));

	let now = new Date();
	now.setMilliseconds(0);
	let next = now.setSeconds(now.getSeconds() + (loc.NEXT_STAR_RISE * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	let remain = HOURS_TO_TIME_STRING(loc.NEXT_STAR_RISE * 24, true, false);
	setText('db-next-starrise', (loc.NEXT_STAR_RISE * 24 * 60 * 60).toFixed(0));
	setText('db-next-starrise-countdown', remain);
	setText('db-next-starrise-date', next);

	now = new Date();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (loc.NEXT_NOON * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(loc.NEXT_NOON * 24, true, false);
	setText('next-noon', (loc.NEXT_NOON * 24 * 60 * 60).toFixed(0));
	setText('next-noon-countdown', remain);
	setText('next-noon-date', next);

	now = new Date();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (loc.NEXT_STAR_SET * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(loc.NEXT_STAR_SET * 24, true, false);
	setText('db-next-starset', (loc.NEXT_STAR_SET * 24 * 60 * 60).toFixed(0));
	setText('db-next-starset-countdown', remain);
	setText('db-next-starset-date', next);
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

		setText(timeElement, string);
	}
}

function setText(elementID, string) {
	let el = (typeof(elementID) === 'string') ? document.getElementById(elementID) : elementID;

	if (!el) {
		console.log('Problematic elementID:', elementID);
		throw 'Invalid [ elementID ] passed to [ setText ] function!';
		return;
	}

	if (el.textContent != string) el.textContent = string;
}

function REAL_TIME(formatAsString = false) {
	let now = new Date();
	return (!formatAsString) ? now.valueOf() : now.toLocaleString();
}

function UNIVERSE_TIME(formatAsString = false) {
	let date2020 = new Date('January 1, 2020 00:00:00Z');
	let date2950 = new Date('January 1, 2950 00:00:00Z');
	let universeTime = date2950.getTime() + ( (new Date() - date2020) * 6);
	return (!formatAsString) ? universeTime : new Date(universeTime).toUTCString();
}

function HOURS_TO_TIME_STRING(hours, includeSeconds = true, limitTo24Hours = true) {
	if (hours < 0) return '- NEGATIVE -';

	let h = hours;
	let m = ( h - Math.floor(h) ) * 60;
	let s = ( m - Math.floor(m) ) * 60;

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



async function loadDatabase() {
	let bodiesCSV = null;

	try {
		const response = await fetch('data/bodies.csv');
		if (!response.ok) {
			throw new Error(`Error fetching celestial bodies: ${response.status}`);
		}
		bodiesCSV = await response.text();
	
	} catch (error) {
		console.error('Error fetching celestial bodies:', error);
	}

	let bodies = parseCSV(bodiesCSV);
	for (let i = 0; i < bodies.length; i++) {
		createCelestialBody(bodies[i]);
	}


	let locationsCSV = null;
	try {
		const response = await fetch('data/locations.csv');
		if (!response.ok) {
			throw new Error(`Error fetching locations: ${response.status}`);
		}
		locationsCSV = await response.text();
	
	} catch (error) {
		console.error('Error fetching locations:', error);
	}

	let locations = parseCSV(locationsCSV);
	for (let i = 0; i < locations.length; i++) {
		createLocation(locations[i]);
	}
}

function parseCSV(csvString) {
	const lines = csvString.split("\n");
	const headers = lines[0].split(',').map(header => header.trim());
	const data = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map(value => value.trim());
		const obj = {};

		for (let j = 0; j < headers.length; j++) {
			obj[headers[j]] = values[j];
		}

		data.push(obj);
	}

	return data;
}

function createCelestialBody(data) {
	let parentBody = (data.parentBody === 'null') ? null : getBodyByName(data.parentBody);
	let parentStar = (data.parentStar === 'null') ? null : getBodyByName(data.parentStar);
	let themeImage = (data.themeImage === 'null') ? null : data.themeImage;

	let body = new CelestialBody(
		String(data.name),
		String(data.type),
		parentBody,
		parentStar,
		{
			'x' : parseFloat(data.coordinateX),
			'y' : parseFloat(data.coordinateY),
			'z' : parseFloat(data.coordinateZ)
		},
		{
			'w' : parseFloat(data.quaternionW),
			'x' : parseFloat(data.quaternionX),
			'y' : parseFloat(data.quaternionY),
			'z' : parseFloat(data.quaternionZ)
		},
		parseFloat(data.bodyRadius),
		parseFloat(data.rotationRate),
		parseFloat(data.rotationCorrection),
		parseFloat(data.orbitAngle),
		parseFloat(data.orbitRadius),
		{
			'r' : parseInt(data.themeColorR),
			'g' : parseInt(data.themeColorG),
			'b' : parseInt(data.themeColorB)
		},
		String(themeImage)
	);

	if (data.ringRadiusInner !== 'null') {
		body.RING = {
			'radius-inner': parseFloat(data.ringRadiusInner),
			'radius-outer': parseFloat(data.ringRadiusOuter)
		}
	}

}

function createLocation(data) {
	let parentBody = (data.parentBody === 'null') ? null : getBodyByName(data.parentBody);
	let parentStar = (data.parentStar === 'null') ? null : getBodyByName(data.parentStar);
	let themeImage = (data.themeImage === 'null') ? null : data.themeImage;

	let location = new Location(
		String(data.name),
		String(data.type),
		parentBody,
		parentStar,
		{
			'x' : parseFloat(data.coordinateX),
			'y' : parseFloat(data.coordinateY),
			'z' : parseFloat(data.coordinateZ)
		},
		null,
		String(themeImage)
	);
}


function getBodyByName(string) {
	let result = window.BODIES.filter(bod => {
		if (bod.NAME === string) {
			return bod;
		}
	});

	if (result.length === 0) {
		console.error(`Body "${string}" not found.`);
		return null;
	}

	return result[0];
}
window.getBodyByName = getBodyByName;

function getLocationByName(string) {
	let result = window.LOCATIONS.filter(loc => {
		if (loc.NAME === string) {
			return loc;
		}
	});

	if (result.length === 0) {
		console.error(`Location "${string}" not found.`);
		return null;
	}

	return result[0];
}
window.getLocationByName = getLocationByName;




// INIT
async function startVerseTime() {
	await loadDatabase();
	window.LOCATIONS.sort((a, b) => a.NAME.localeCompare(b.NAME));
	populateLocationList();
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
