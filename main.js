import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE } from './HelperFunctions.js';
import CelestialBody from './CelestialBody.js';
import Location from './Location.js';


window.BODIES = Array();
window.LOCATIONS = Array();
window.ACTIVE_LOCATION = null;
window.SETTING_24HR = true;
window.DEBUG_MODE = false;


// FUNCTIONS
function update() {

	let location = window.ACTIVE_LOCATION;
	let body = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	let col = location.THEME_COLOR;
	document.querySelector(':root').style.setProperty('--theme-color', `rgb(${col.r}, ${col.g}, ${col.b})`);
	document.querySelector(':root').style.setProperty('--theme-color-dark', `rgb(${col.r*0.2}, ${col.g*0.2}, ${col.b*0.2})`);
	document.getElementById('selected-location-bg-image').backgroundColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
	document.getElementById('selected-location-bg-image').style.backgroundImage = `url('${location.THEME_IMAGE}')`;


	// REALTIME & UNIVERSE CLOCKS
	// document.getElementById('gmt-time').innerHTML = new Date().toUTCString();
	// document.getElementById('universe-time').innerHTML = UNIVERSE_TIME(true).replace('GMT', 'SET');


	// MAIN LOCATION INFO
	if (location.LOCAL_TIME.toString() === 'NaN') {
		setText('local-time', location.ILLUMINATION_STATUS);
	} else {
		setText('local-time', HOURS_TO_TIME_STRING(location.LOCAL_TIME/60/60, false));
	}
	setText('location-name', location.NAME);
	setText('location-body-name', location.PARENT.NAME);
	// setText('location-body-type', location.PARENT.TYPE);


	// RISE/SET COUNTDOWNS
	let nextRise = location.NEXT_STAR_RISE;
	if (nextRise.toString() === 'NaN') {
		setText('next-rise-countdown', '---');
	} else {
		nextRise = (location.NEXT_STAR_RISE * 86400 < 120) ? '- NOW -' : HOURS_TO_TIME_STRING(nextRise * 24, true, false);
		setText('next-rise-countdown', nextRise);
	}

	let nextSet = location.NEXT_STAR_SET;
	if (nextSet.toString() === 'NaN') {
		setText('next-set-countdown', '---');
	} else {
		nextSet = (location.NEXT_STAR_SET * 86400 < 120) ? '- NOW -' : HOURS_TO_TIME_STRING(nextSet * 24, true, false);
		setText('next-set-countdown', nextSet);
	}


	// RISE/SET LOCAL TIMES
	if (nextRise.toString() === 'NaN') {
		setText('local-rise-time', '---');
	} else {
		setText('local-rise-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_RISE_TIME * 24, false, true));
	}

	if (nextSet.toString() === 'NaN') {
		setText('local-set-time', '---');
	} else {
		setText('local-set-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_SET_TIME * 24, false, true));
	}


	// RISE/SET REAL TIMES
	let now = new Date();
	if (nextRise.toString() === 'NaN') {
		setText('next-rise-time', '---');
	} else {
		let rise = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 86400));
		if (new Date(rise).getSeconds() === 59) rise = new Date(rise + 1000);
		setText('next-rise-time', DATE_TO_SHORT_TIME(new Date(rise)));
	}

	now = new Date();
	if (nextSet.toString() === 'NaN') {
		setText('next-set-time', '---');
	} else {
		let set = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 86400));
		if (new Date(set).getSeconds() === 59) set = new Date(set.getTime() + 1000);
		setText('next-set-time', DATE_TO_SHORT_TIME(new Date(set)));
	}


	// ILLUMINATION STATUS
	setText('illumination-status', location.ILLUMINATION_STATUS);


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
		setText('day-length', (bod.ROTATION_RATE*60*60).toLocaleString());
		setText('day-length-readable', HOURS_TO_TIME_STRING(bod.ROTATION_RATE));
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
			string = HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false, true) + '<br>' + location.ILLUMINATION_STATUS;
		}

		setText(timeElement, string);
	}
}

function setText(elementID, string) {
	let el = (typeof(elementID) === 'string') ? document.getElementById(elementID) : elementID;

	if (!el) {
		throw 'Invalid [ elementID ] passed to [ setText ] function!';
		return;
	}

	if (el.innerHTML != string) el.innerHTML = string;
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

	if (limitTo24Hours && h > 24) h -= 24;
	
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



// DATABASE
// CELESTIAL BODIES
const STANTON = new CelestialBody(
	'Stanton',
	'Star',
	null,
	null,
	{
		'x' : 136049.870,
		'y' : 1294427.400,
		'z' : 2923345.368
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000001,
		'z' : 0.00000002
	},
	696000.000,
	0,
	0,
	0,
	0
)

const ARCCORP = new CelestialBody(
	'ArcCorp',
	'Planet',
	STANTON,
	STANTON,
	{
		'x' : 18587664.740,
		'y' : -22151916.920,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	800.000,
	3.1099999,
	230.73368,
	310.000,
	28917272.576,
	{
		'r' : 172,
		'g' : 102,
		'b' : 90
	}
)

const LYRIA = new CelestialBody(
	'Lyria',
	'Moon',
	ARCCORP,
	STANTON,
	{
		'x' : 18703607.172,
		'y' : -22121650.134,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	223.000,
	6.4299998,
	359.36575,
	14.631,
	119827.896,
	{
		'r' : 112,
		'g' : 142,
		'b' : 178
	},
	'https://starcitizen.tools/images/thumb/a/aa/Stanton-arccorp-lyria-orbit-3.12.jpg/640px-Stanton-arccorp-lyria-orbit-3.12.jpg'
)

const WALA = new CelestialBody(
	'Wala',
	'Moon',
	ARCCORP,
	STANTON,
	{
		'x' : 18379649.310,
		'y' : -22000466.768,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	283.000,
	6.3200002,
	135.45425,
	143.943,
	257308.320,
	{
		'r' : 124,
		'g' : 150,
		'b' : 158
	},
	'https://starcitizen.tools/images/thumb/f/ff/Stanton-arccorp-wala-orbit-3.12.jpg/640px-Stanton-arccorp-wala-orbit-3.12.jpg'
)

const CRUSADER = new CelestialBody(
	'Crusader',
	'Planet',
	STANTON,
	STANTON,
	{
		'x' : -18962176.000,
		'y' : -2664960.000,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	7450.010,
	5.0999999,
	300.33377,
	188.000,
	19148527.616,
	{
		'r' : 231,
		'g' : 152,
		'b' : 147
	},
)

const CELLIN = new CelestialBody(
	'Cellin',
	'Moon',
	CRUSADER,
	STANTON,
	{
		'x' : -18987611.119,
		'y' : -2709009.661,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	260.000,
	4.4499998,
	253.46701,
	240.000,
	50863.260,
	{
		'r' : 113,
		'g' : 127,
		'b' : 144
	},
	'https://starcitizen.tools/images/thumb/5/5c/Stanton-crusader-cellin-orbit-3.8.0.jpg/800px-Stanton-crusader-cellin-orbit-3.8.0.jpg'
)

const DAYMAR = new CelestialBody(
	'Daymar',
	'Moon',
	CRUSADER,
	STANTON,
	{
		'x' : -18930539.540,
		'y' : -2610158.765,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	295.000,
	2.4800000,
	30.29544,
	60.000,
	63279.908,
	{
		'r' : 211,
		'g' : 170,
		'b' : 150
	},
	'https://starcitizen.tools/images/thumb/5/52/Stanton-crusader-daymar-3.8.0.jpg/640px-Stanton-crusader-daymar-3.8.0.jpg'
)

const YELA = new CelestialBody(
	'Yela',
	'Moon',
	CRUSADER,
	STANTON,
	{
		'x' : -19022916.799,
		'y' : -2613996.152,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	313.000,
	1.8200001,
	217.58054,
	140.000,
	79286.88,
	{
		'r' : 128,
		'g' : 128,
		'b' : 150
	},
	'https://starcitizen.tools/images/thumb/8/8f/Stanton-crusader-yela-orbit-3.8.0.jpg/640px-Stanton-crusader-yela-orbit-3.8.0.jpg'
)

const MICROTECH = new CelestialBody(
	'microTech',
	'Planet',
	STANTON,
	STANTON,
	{
		'x' : 22462016.306,
		'y' : 37185625.646,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	1000.000,
	4.1199999,
	217.11688,
	58.866,
	43443216.384,
	{
		'r' : 167,
		'g' : 184,
		'b' : 193
	}
)

const CALLIOPE = new CelestialBody(
	'Calliope',
	'Moon',
	MICROTECH,
	STANTON,
	{
		'x' : 22398369.308,
		'y' : 37168840.679,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	240.000,
	4.5900002,
	212.32677,
	194.774,
	65823.064,
	{
		'r' : 124,
		'g' : 132,
		'b' : 148
	},
	'https://starcitizen.tools/images/thumb/9/9a/Calliope-orbit1.png/640px-Calliope-orbit1.png'
)

const CLIO = new CelestialBody(
	'Clio',
	'Moon',
	MICROTECH,
	STANTON,
	{
		'x' : 22476728.221,
		'y' : 37091020.074,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	337.170,
	0.0000000,
	0.00000,
	278.839,
	95742.640,
	{
		'r' : 130,
		'g' : 141,
		'b' : 137
	},
	'https://starcitizen.tools/images/thumb/2/27/Clio-orbit.png/640px-Clio-orbit.png'
)

const EUTERPE = new CelestialBody(
	'Euterpe',
	'Moon',
	MICROTECH,
	STANTON,
	{
		'x' : 22488109.736,
		'y' : 37081123.565,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	213.000,
	4.2800002,
	269.04452,
	284.020,
	107710.472,
	{
		'r' : 130,
		'g' : 141,
		'b' : 159
	},
	'https://starcitizen.tools/images/thumb/5/53/Euterpe-orbit1.png/640px-Euterpe-orbit1.png'
)

const HURSTON = new CelestialBody(
	'Hurston',
	'Planet',
	STANTON,
	STANTON,
	{
		'x' : 12850457.093,
		'y' : 0.000,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	1000.000,
	2.4800000,
	19.10777,
	0.000,
	12850457.600,
	{
		'r' : 138,
		'g' : 101,
		'b' : 71
	}
)

const ABERDEEN = new CelestialBody(
	'Aberdeen',
	'Moon',
	HURSTON,
	STANTON,
	{
		'x' : 12905757.636,
		'y' : 40955.551,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	274.000,
	2.5999999,
	116.67681,
	36.524,
	68815.024,
	{
		'r' : 219,
		'g' : 180,
		'b' : 88
	}
)

const ARIAL = new CelestialBody(
	'Arial',
	'Moon',
	HURSTON,
	STANTON,
	{
		'x' : 12892673.309,
		'y' : -31476.129,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	344.500,
	5.5100002,
	38.40291,
	323.292,
	52658.856,
	{
		'r' : 214,
		'g' : 142,
		'b' : 34
	}
)

const ITA = new CelestialBody(
	'Ita',
	'Moon',
	HURSTON,
	STANTON,
	{
		'x' : 12830194.716,
		'y' : 114913.609,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	325.000,
	4.8499999,
	243.07207,
	100.000,
	116686.336,
	{
		'r' : 121,
		'g' : 135,
		'b' : 122
	}
)

const MAGDA = new CelestialBody(
	'Magda',
	'Moon',
	HURSTON,
	STANTON,
	{
		'x' : 12792686.359,
		'y' : -74464.581,
		'z' : 0.000
	},
	{
		'w' : 1.00000000,
		'x' : 0.00000000,
		'y' : 0.00000000,
		'z' : 0.00000000
	},
	340.830,
	1.9400001,
	242.12456,
	232.195,
	94246.656,
	{
		'r' : 207,
		'g' : 165,
		'b' : 159
	}
)



// LOCATIONS
const ARCCORP_MINING_141 = new Location(
	'ArcCorp Mining Area 141',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : -18.167,
		'y' : 180.362,
		'z' : -232.760
	},
	null,
	'https://starcitizen.tools/images/thumb/4/4f/Daymar_ArcCorp-Mining-Area-141_Morning.jpg/800px-Daymar_ArcCorp-Mining-Area-141_Morning.jpg'
)

const AREA18 = new Location(
	'Area18',
	'Landing Zone',
	ARCCORP,
	STANTON,
	{
		'x' : -747.409,
		'y' : -116.734,
		'z' : -262.094
	},
	null,
	'https://starcitizen.tools/images/thumb/5/5d/Arccorp-area18-aerial-view-to-spaceport.jpg/800px-Arccorp-area18-aerial-view-to-spaceport.jpg'
)

const BAIJINI_POINT = new Location(
	'Baijini Point',
	'Space Station',
	ARCCORP,
	STANTON,
	{
		'x' : -771.961,
		'y' : -321.347,
		'z' : -359.509
	},
	null,
	'https://starcitizen.tools/images/thumb/6/6e/Arccorp-baijini-point-01.jpg/800px-Arccorp-baijini-point-01.jpg'
)

const EVERUS_HARBOR = new Location(
	'Everus Harbor',
	'Space Station',
	HURSTON,
	STANTON,
	{
		'x' : -507.742,
		'y' : -903.464,
		'z' : 496.489
	},
	null,
	'https://starcitizen.tools/images/thumb/7/72/Hurston-everus-harbor-01.jpg/800px-Hurston-everus-harbor-01.jpg'
)

const GRIMHEX = new Location(
	'GrimHEX',
	'Asteroid Base',
	YELA,
	STANTON,
	{
		'x' : -568.659,
		'y' : +383.565,
		'z' : -2.042
	},
	null,
	'https://starcitizen.tools/images/thumb/0/09/Star_Citizen_-_GrimHEX_close-up.png/800px-Star_Citizen_-_GrimHEX_close-up.png'
)

const LORVILLE = new Location(
	'Lorville',
	'Landing Zone',
	HURSTON,
	STANTON,
	{
		'x' : -328.989,
		'y' : -752.435,
		'z' : 572.120
	},
	null,
	'https://starcitizen.tools/images/thumb/3/34/Lorville_3.3.6_Raoul.png/800px-Lorville_3.3.6_Raoul.png'
)

const NEW_BABBAGE = new Location(
	'New Babbage',
	'Landing Zone',
	MICROTECH,
	STANTON,
	{
		'x' : 520.723,
		'y' : 419.364,
		'z' : 743.655
	},
	null,
	'https://starcitizen.tools/images/thumb/a/af/Microtech-new-babbage-cityscape-09.jpg/800px-Microtech-new-babbage-cityscape-09.jpg'
)

const ORISON = new Location(
	'Orison',
	'Landing Zone',
	CRUSADER,
	STANTON,
	{
		'x' : 5295.517,
		'y' : -863.194,
		'z' : 5282.237
	},
	null,
	'https://starcitizen.tools/images/thumb/3/33/Orison-demo-wip-isc-20210624-11.png/800px-Orison-demo-wip-isc-20210624-11.png'
)

const PORT_OLISAR = new Location(
	'Port Olisar',
	'Space Station',
	CRUSADER,
	STANTON,
	{
		'x' : 5965.000,
		'y' : -472.142,
		'z' : 5667.009
	},
	null,
	'https://starcitizen.tools/images/thumb/3/3d/Crusader-port-olisar-3.14.jpg/800px-Crusader-port-olisar-3.14.jpg'
)

const PORT_TRESSLER = new Location(
	'Port Tressler',
	'Space Station',
	MICROTECH,
	STANTON,
	{
		'x' : 561.471,
		'y' : 545.853,
		'z' : 808.832
	},
	null,
	'https://starcitizen.tools/images/thumb/9/9a/Microtech-port-tressler-01.jpg/800px-Microtech-port-tressler-01.jpg'
)

const SHUBIN_MINING_SCD1 = new Location(
	'Shubin Mining Facility SCD-1',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 126.025,
		'y' : -149.581,
		'z' : 221.253
	},
	null,
	'https://starcitizen.tools/images/thumb/4/45/Daymar_Shubin-Mining-Facility-SCD1_Day-1.jpg/800px-Daymar_Shubin-Mining-Facility-SCD1_Day-1.jpg'
)

const BOUNTIFUL_HARVEST_HYDROPONICS = new Location(
	'Bountiful Harvest Hydroponics',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 57.552,
		'y' : -92.267,
		'z' : -274.246
	},
	null,
	'https://starcitizen.tools/images/thumb/f/f0/Bountiful_Harvest_Hydroponics_2.jpg/800px-Bountiful_Harvest_Hydroponics_2.jpg'
)

const RAYARI_DELTANA = new Location(
	'Rayari Deltana Research Outpost',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : -693.910,
		'y' : -648.299,
		'z' : +316.681
	},
	null,
	'https://starcitizen.tools/images/thumb/9/90/Rayari_Deltana_Research_Outpost_3.9.jpg/800px-Rayari_Deltana_Research_Outpost_3.9.jpg'
)

const HDMS_OPAREI = new Location(
	'HDMS-Oparei',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : -556.126,
		'y' : -72.591,
		'z' : -828.071
	},
	null,
	'https://starcitizen.tools/images/thumb/4/40/Hurston_HDMS-Oparei_SC-Alpha-3.10.jpg/800px-Hurston_HDMS-Oparei_SC-Alpha-3.10.jpg'
)

const KLESCHER_ABERDEEN = new Location(
	'Klescher Rehabilitation Facility',
	'Prison',
	ABERDEEN,
	STANTON,
	{
		'x' : 44.975,
		'y' : 221.563,
		'z' : -156.583
	},
	null,
	'https://starcitizen.tools/images/thumb/c/cc/Klescher_Rehabilitation_Facility_Aberdeen.png/800px-Klescher_Rehabilitation_Facility_Aberdeen.png'
)

const JUMPTOWN = new Location(
	'Jumptown',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 268.025,
		'y' : 143.784,
		'z' : 74.777
	},
	null,
	'https://starcitizen.tools/images/thumb/b/b1/Jumptown%2C_Yela_%28Alpha_3.17%29.jpg/800px-Jumptown%2C_Yela_%28Alpha_3.17%29.jpg'
)

const PARADISE_COVE = new Location(
	'Paradise Cove',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : -10.654,
		'y' : +147.439,
		'z' : -168.175
	},
	null,
	'https://starcitizen.tools/images/thumb/2/2b/Lyria_Paradise-Cove_Day.jpg/800px-Lyria_Paradise-Cove_Day.jpg'
)

const RAVENS_ROOST = new Location(
	'Raven\'s Roost',
	'Outpost',
	CALLIOPE,
	STANTON,
	{
		'x' : 33.908,
		'y' : -106.400,
		'z' : -212.484
	},
	null,
	'https://starcitizen.tools/images/thumb/0/0a/Calliope_Raven%27s_Roost_3.13.0_16.04.2021_14_20_09.png/800px-Calliope_Raven%27s_Roost_3.13.0_16.04.2021_14_20_09.png'
)

const HDMS_ANDERSON = new Location(
	'HDMS Anderson',
	'Outpost',
	ABERDEEN,
	STANTON,
	{
		'x' : -26.950,
		'y' : 180.221,
		'z' : 206.879
	},
	null,
	'https://starcitizen.tools/images/thumb/d/dc/Platinum_Bay_HDMS-Anderson.jpg/800px-Platinum_Bay_HDMS-Anderson.jpg'
)

const HDMS_NORGAARD = new Location(
	'HDMS Norgaard',
	'Outpost',
	ABERDEEN,
	STANTON,
	{
		'x' : -141.572,
		'y' : 195.318,
		'z' : 132.098
	},
	null,
	'https://starcitizen.tools/images/thumb/b/bc/Platinum_Bay_HDMS-Norgaard.jpg/800px-Platinum_Bay_HDMS-Norgaard.jpg'
)

const RAYARI_ANVIK = new Location(
	'Rayari Anvik Research Outpost',
	'Outpost',
	CALLIOPE,
	STANTON,
	{
		'x' : -184.632,
		'y' : -127.794,
		'z' : 84.724
	},
	null,
	'https://starcitizen.tools/images/thumb/b/b5/Calliope_Rayari_Anvik_3.13.0_16.04.2021_14_25_11.png/800px-Calliope_Rayari_Anvik_3.13.0_16.04.2021_14_25_11.png'
)

const RAYARI_KALTAG = new Location(
	'Rayari Kaltag Research Outpost',
	'Outpost',
	CALLIOPE,
	STANTON,
	{
		'x' : 205.267,
		'y' : 6.261,
		'z' : -124.485
	},
	null,
	'https://starcitizen.tools/images/thumb/0/0c/Calliope_Kaltag_3.13.0_15.04.2021_11_03_26.png/800px-Calliope_Kaltag_3.13.0_15.04.2021_11_03_26.png'
)

const SHUBIN_MINING_SMCA6 = new Location(
	'Shubin Mining Facility SMCa-6',
	'Outpost',
	CALLIOPE,
	STANTON,
	{
		'x' : 50.066,
		'y' : 233.437,
		'z' : 24.936
	},
	null,
	'https://starcitizen.tools/images/thumb/8/85/Calliope_SMCa-6_3.13.0_16.04.2021_12_36_54.png/800px-Calliope_SMCa-6_3.13.0_16.04.2021_12_36_54.png'
)

const SHUBIN_MINING_SMCA8 = new Location(
	'Shubin Mining Facility SMCa-8',
	'Outpost',
	CALLIOPE,
	STANTON,
	{
		'x' : 160.166,
		'y' : 168.987,
		'z' : -58.400
	},
	null,
	'https://starcitizen.tools/images/thumb/6/60/Calliope_SMCa-8_3.13.0_16.04.2021_12_40_34.png/800px-Calliope_SMCa-8_3.13.0_16.04.2021_12_40_34.png'
)

const HUMBOLDT_MINES = new Location(
	'Humboldt Mines',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : 5.311,
		'y' : -193.819,
		'z' : -112.545
	},
	null,
	'https://starcitizen.tools/images/thumb/9/98/Humboldt_Mines.png/800px-Humboldt_Mines.png'
)

const LOVERIDGE_MINERAL_RESERVE = new Location(
	'Loveridge Mineral Reserve',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : 181.800,
		'y' : 128.166,
		'z' : 24.940
	},
	null,
	'https://starcitizen.tools/images/thumb/e/e9/Loveridge_Mineral_Reserve2.png/800px-Loveridge_Mineral_Reserve2.png'
)

const SHUBIN_MINING_SAL2 = new Location(
	'Shubin Mining Facility SAL-2',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : 150.636,
		'y' : -53.619,
		'z' : 156.668
	},
	null,
	'https://starcitizen.tools/images/thumb/7/70/Shubin_Mining_Facility_SAL-2.png/800px-Shubin_Mining_Facility_SAL-2.png'
)

const SHUBIN_MINING_SAL5 = new Location(
	'Shubin Mining Facility SAL-5',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : 98.070,
		'y' : 78.361,
		'z' : 185.821
	},
	null,
	'https://starcitizen.tools/images/thumb/4/41/Shubin_Mining_Facility_SAL-5_Daytime.jpg/800px-Shubin_Mining_Facility_SAL-5_Daytime.jpg'
)

const THE_ORPHANAGE = new Location(
	'The Orphanage',
	'Outpost',
	LYRIA,
	STANTON,
	{
		'x' : -91.990,
		'y' : 92.484,
		'z' : 182.182
	},
	null,
	'https://starcitizen.tools/images/thumb/e/e7/Lyria_The-Orphanage_Day.jpg/800px-Lyria_The-Orphanage_Day.jpg'
)

const HDMS_BEZDEK = new Location(
	'HDMS-Bezdek',
	'Outpost',
	ARIAL,
	STANTON,
	{
		'x' : 26.735,
		'y' : -234.698,
		'z' : 251.505
	},
	null,
	'https://starcitizen.tools/images/thumb/9/9b/Arial_HDMS-Bezdek_Day.jpg/800px-Arial_HDMS-Bezdek_Day.jpg'
)

const HDMS_LATHAN = new Location(
	'HDMS-Lathan',
	'Outpost',
	ARIAL,
	STANTON,
	{
		'x' : 339.193,
		'y' : 33.686,
		'z' : 55.843
	},
	null,
	'https://starcitizen.tools/images/thumb/8/8d/HDMS-Lathan2.png/800px-HDMS-Lathan2.png'
)

const GALLETE_FAMILY_FARMS = new Location(
	'Gallete Family Farms',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : -89.471,
		'y' : 106.717,
		'z' : 220.041
	},
	null,
	'https://starcitizen.tools/images/thumb/0/0e/Cellin_Gallete-Family-Farms_Day.jpg/800px-Cellin_Gallete-Family-Farms_Day.jpg'
)

const HICKES_RESEARCH = new Location(
	'Hickes Research Outpost',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 3.270,
		'y' : 13.091,
		'z' : -260.316
	},
	null,
	'https://starcitizen.tools/images/thumb/1/1b/Cellin_Hickes-Research-Outpost_Twilight_Alpha-3.10.jpg/800px-Cellin_Hickes-Research-Outpost_Twilight_Alpha-3.10.jpg'
)

const TERRA_MILLS_HYDROFARM = new Location(
	'Terra Mills HydroFarm',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 100.137,
		'y' : 27.701,
		'z' : 239.024
	},
	null,
	'https://starcitizen.tools/images/thumb/0/05/Terra_Mills_HydroFarm.png/800px-Terra_Mills_HydroFarm.png'
)

const TRAM_AND_MYERS_MINING = new Location(
	'Tram & Myers Mining',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : -241.164,
		'y' : 2.396,
		'z' : -98.700
	},
	null,
	'https://starcitizen.tools/images/thumb/5/55/Cellin_Tram-and-Myers_Day.jpg/800px-Cellin_Tram-and-Myers_Day.jpg'
)

const KUDRE_ORE = new Location(
	'Kudre Ore',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 146.617,
		'y' : -177.093,
		'z' : -184.862
	},
	null,
	'https://starcitizen.tools/images/thumb/e/e3/KudreOre_Front.jpg/800px-KudreOre_Front.jpg'
)

const BRIOS_BREAKER_YARD = new Location(
	'Brio\'s Breaker Yard',
	'Scrapyard',
	DAYMAR,
	STANTON,
	{
		'x' : -176.683,
		'y' : -161.257,
		'z' : 173.852
	},
	null,
	'https://starcitizen.tools/images/thumb/d/d0/Brio_Breaker_Yard.png/800px-Brio_Breaker_Yard.png'
)

const RECLAMATION_AND_DISPOSAL_ORINTH = new Location(
	'Reclamation & Disposal Orinth',
	'Scrapyard',
	HURSTON,
	STANTON,
	{
		'x' : 1.141,
		'y' : -794.276,
		'z' : 607.652
	},
	null,
	'https://starcitizen.tools/images/thumb/e/ed/Reclamation_%26_Disposal_Orinth3.png/800px-Reclamation_%26_Disposal_Orinth3.png'
)

const RAYARI_CANTWELL = new Location(
	'Rayari Cantwell Research Outpost',
	'Outpost',
	CLIO,
	STANTON,
	{
		'x' : -217.175,
		'y' : 215.278,
		'z' : 142.842
	},
	null,
	'https://starcitizen.tools/images/thumb/e/e1/Clio_Rayari_Cantwell_Research_Outpost_3.13.0_15.04.2021_8_50_57.png/800px-Clio_Rayari_Cantwell_Research_Outpost_3.13.0_15.04.2021_8_50_57.png'
)

const RAYARI_MCGRATH = new Location(
	'Rayari McGrath Research Outpost',
	'Outpost',
	CLIO,
	STANTON,
	{
		'x' : -325.904,
		'y' : -85.713,
		'z' : -18.786
	},
	null,
	'https://starcitizen.tools/images/thumb/7/74/Clio_Rayari_McGrath_Research_Outpost_3.13.0_15.04.2021_10_58_23.png/800px-Clio_Rayari_McGrath_Research_Outpost_3.13.0_15.04.2021_10_58_23.png'
)

const BUDS_GROWERY = new Location(
	'Bud\'s Growery',
	'Outpost',
	EUTERPE,
	STANTON,
	{
		'x' : 50.173,
		'y' : -172.259,
		'z' : 115.271
	},
	null,
	'https://starcitizen.tools/images/thumb/d/d9/Euterpe_Bud%27s_Growery_3.13.0_15.04.2021_8_39_43.png/800px-Euterpe_Bud%27s_Growery_3.13.0_15.04.2021_8_39_43.png'
)

const DEVLIN_SCRAP_AND_SALVAGE = new Location(
	'Devlin Scrap & Salvage',
	'Scrapyard',
	EUTERPE,
	STANTON,
	{
		'x' : 14.506,
		'y' : 211.267,
		'z' : 25.886
	},
	null,
	'https://starcitizen.tools/images/thumb/a/af/Euterpe_Devlin_Scrap_%26_Salvage_3.13.0_15.04.2021_8_31_28.png/800px-Euterpe_Devlin_Scrap_%26_Salvage_3.13.0_15.04.2021_8_31_28.png'
)

const HDMS_RYDER = new Location(
	'HDMS-Ryder',
	'Outpost',
	ITA,
	STANTON,
	{
		'x' : -175.874,
		'y' : -263.381,
		'z' : 73.709
	},
	null,
	'https://starcitizen.tools/images/thumb/c/cb/Ita_HDMS-Ryder_Day_SC-Alpha-3.10.jpg/800px-Ita_HDMS-Ryder_Day_SC-Alpha-3.10.jpg'
)

const HDMS_WOODRUFF = new Location(
	'HDMS-Woodruff',
	'Outpost',
	ITA,
	STANTON,
	{
		'x' : -175.874,
		'y' : -263.381,
		'z' : 73.709
	},
	null,
	'https://starcitizen.tools/images/thumb/4/4a/HDMS-Woodruff2.png/800px-HDMS-Woodruff2.png'
)

const HDMS_HAHN = new Location(
	'HDMS-Hahn',
	'Outpost',
	MAGDA,
	STANTON,
	{
		'x' : -147.384,
		'y' : -292.217,
		'z' : 95.247
	},
	null,
	'https://starcitizen.tools/images/thumb/3/38/Hdms_hahn.jpg/800px-Hdms_hahn.jpg'
)

const HDMS_PERLMAN = new Location(
	'HDMS-Perlman',
	'Outpost',
	MAGDA,
	STANTON,
	{
		'x' : -140.696,
		'y' : 287.922,
		'z' : -116.688
	},
	null,
	'https://starcitizen.tools/images/thumb/5/56/HDMS-Perlman.png/800px-HDMS-Perlman.png'
)

const ARCCORP_MINING_045 = new Location(
	'ArcCorp Mining Area 045',
	'Outpost',
	WALA,
	STANTON,
	{
		'x' : -282.798,
		'y' : 14.108,
		'z' : 10.620
	},
	null,
	'https://starcitizen.tools/images/thumb/6/6e/ArcCorp_Mining_Area_045.png/800px-ArcCorp_Mining_Area_045.png'
)

const ARCCORP_MINING_048 = new Location(
	'ArcCorp Mining Area 048',
	'Outpost',
	WALA,
	STANTON,
	{
		'x' : -178.193,
		'y' : 97.756,
		'z' : -196.340
	},
	null,
	'https://starcitizen.tools/images/thumb/7/7a/ArcCorp_Mining_Area_048.png/800px-ArcCorp_Mining_Area_048.png'
)

const ARCCORP_MINING_056 = new Location(
	'ArcCorp Mining Area 056',
	'Outpost',
	WALA,
	STANTON,
	{
		'x' : 116.546,
		'y' : -50.147,
		'z' : 253.155
	},
	null,
	'https://starcitizen.tools/images/thumb/c/cf/ArcCorp_Mining_Area_056.png/800px-ArcCorp_Mining_Area_056.png'
)

const ARCCORP_MINING_061 = new Location(
	'ArcCorp Mining Area 061',
	'Outpost',
	WALA,
	STANTON,
	{
		'x' : -21.040,
		'y' : -247.548,
		'z' : -132.570
	},
	null,
	'https://starcitizen.tools/images/thumb/d/d6/ArcCorp_Mining_Area_061.png/800px-ArcCorp_Mining_Area_061.png'
)

const SAMSON_AND_SONS = new Location(
	'Samson & Son\'s Salvage Yard',
	'Scrapyard',
	WALA,
	STANTON,
	{
		'x' : -42.545,
		'y' : 279.059,
		'z' : 19.438
	},
	null,
	'https://starcitizen.tools/images/thumb/c/c2/Samson_and_Sons_Salvage_Center.png/800px-Samson_and_Sons_Salvage_Center.png'
)

const SHADY_GLEN_FARMS = new Location(
	'Shady Glen Farms',
	'Outpost',
	WALA,
	STANTON,
	{
		'x' : -20.622,
		'y' : 268.985,
		'z' : 87.534
	},
	null,
	'https://starcitizen.tools/images/thumb/f/f1/Wala_Shady-Glen-Farms_Day.jpg/800px-Wala_Shady-Glen-Farms_Day.jpg'
)

const DAYMAR_JAVELIN_WRECK = new Location(
	'Javelin Wreck \(UEES Flyssa\)',
	'Wreck',
	DAYMAR,
	STANTON,
	{
		'x' : 102.055,
		'y' : 267.619,
		'z' : -70.856
	},
	null,
	'https://starcitizen.tools/images/thumb/c/c2/Javelin_Wreck_%28UEES_Flyssa%29%2C_Daymar%2C_Alpha_3.17.jpg/800px-Javelin_Wreck_%28UEES_Flyssa%29%2C_Daymar%2C_Alpha_3.17.jpg'
)

const NUEN_WASTE_MANAGEMENT = new Location(
	'Nuen Waste Management',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 73.139,
		'y' : 285.904,
		'z' : 1.906
	},
	null,
	'https://starcitizen.tools/images/thumb/5/53/Nuen_Waste_Management%2C_Daymar%2C_Alpha_3.17.jpg/800px-Nuen_Waste_Management%2C_Daymar%2C_Alpha_3.17.jpg'
)

const NT_999_XVI = new Location(
	'NT-999-XVI',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 251.045,
		'y' : 153.850,
		'z' : -23.796
	},
	null,
	'https://starcitizen.tools/images/thumb/5/57/NT-999-XVI_Bunker_Entrance%2C_Daymar.jpg/800px-NT-999-XVI_Bunker_Entrance%2C_Daymar.jpg'
)

const THE_GARDEN = new Location(
	'The Garden',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : -175.415,
		'y' : 146.965,
		'z' : 186.269
	},
	null,
	'https://starcitizen.tools/images/thumb/d/dd/The_Garden%2C_Daymar_%28Alpha_3.17%29.jpg/800px-The_Garden%2C_Daymar_%28Alpha_3.17%29.jpg'
)

const TPF = new Location(
	'TPF',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 38.490,
		'y' : 203.592,
		'z' : -210.032
	},
	null,
	'https://starcitizen.tools/images/thumb/f/f1/TPF_Underground_Bunker%2C_Daymar%2C_Alpha_3.17.jpg/800px-TPF_Underground_Bunker%2C_Daymar%2C_Alpha_3.17.jpg'
)

const ARCCORP_MINING_157 = new Location(
	'ArcCorp Mining Area 157',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 6.023,
		'y' : 222.356,
		'z' : 220.313
	},
	null,
	'https://starcitizen.tools/images/thumb/0/0f/Yela_Arccorp-157_Day_Alpha-3.10.jpg/800px-Yela_Arccorp-157_Day_Alpha-3.10.jpg'
)

const BENSON_MINING = new Location(
	'Benson Mining Outpost',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 48.998	,
		'y' : -275.606,
		'z' : -140.136
	},
	null,
	'https://starcitizen.tools/images/thumb/8/82/Yela_Benson-Mining-Outpost_Day.jpg/800px-Yela_Benson-Mining-Outpost_Day.jpg'
)

const DEAKINS_RESEARCH = new Location(
	'Deakins Research Outpost',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 231.587,
		'y' : -210.279,
		'z' : 13.278
	},
	null,
	'https://starcitizen.tools/images/thumb/a/ad/Deakins_Research_Outpost.png/800px-Deakins_Research_Outpost.png'
)

const NT_999_XX = new Location(
	'NT-999-XX',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : -205.659,
		'y' : -73.988,
		'z' : 224.325
	},
	null,
	'https://starcitizen.tools/images/thumb/0/0d/NT-999-XX_outpost_on_Yela_%28Alpha_3.17%29.png/800px-NT-999-XX_outpost_on_Yela_%28Alpha_3.17%29.png'
)

const HDMS_EDMOND = new Location(
	'HDMS-Edmond',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : -284.480,
		'y' : -730.502,
		'z' : 620.924
	},
	null,
	'https://starcitizen.tools/images/thumb/c/c4/HDMS_Edmond.png/800px-HDMS_Edmond.png'
)

const HDMS_HADLEY = new Location(
	'HDMS-Hadley',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : 626.167,
		'y' : -583.971,
		'z' : -518.485
	},
	null,
	'https://starcitizen.tools/images/thumb/a/a6/HDMS_Hadley.png/800px-HDMS_Hadley.png'
)

const HDMS_PINEWOOD = new Location(
	'HDMS-Pinewood',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : 985.564,
		'y' : 90.029,
		'z' : 149.896
	},
	null,
	'https://starcitizen.tools/images/thumb/a/a6/In_front_of_HDMS_Pinewood.jpg/800px-In_front_of_HDMS_Pinewood.jpg'
)

const HDMS_STANHOPE = new Location(
	'HDMS-Stanhope',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : -648.608,
		'y' : 198.313,
		'z' : 735.121
	},
	null,
	'https://starcitizen.tools/images/thumb/9/9b/HDMS_Stanhope.png/800px-HDMS_Stanhope.png'
)

const HDMS_THEDUS = new Location(
	'HDMS-Thedus',
	'Outpost',
	HURSTON,
	STANTON,
	{
		'x' : 443.322,
		'y' : 891.525,
		'z' : 101.509
	},
	null,
	'https://starcitizen.tools/images/thumb/d/d3/HDMS_Thedus_Sunrise.jpg/800px-HDMS_Thedus_Sunrise.jpg'
)

const SHUBIN_MINING_SM0_10 = new Location(
	'Shubin Mining Facility SM0-10',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : 85.476,
		'y' : -950.856,
		'z' : 298.799
	},
	null,
	'https://starcitizen.tools/images/thumb/4/49/Shubin_Mining_Facility_SM0-10_26.04.2020_13_44_28.png/800px-Shubin_Mining_Facility_SM0-10_26.04.2020_13_44_28.png'
)

const SHUBIN_MINING_SM0_13 = new Location(
	'Shubin Mining Facility SM0-13',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : -172.819,
		'y' : -981.308,
		'z' : 97.767
	},
	null,
	'https://starcitizen.tools/images/thumb/0/06/Shubin_Mining_Facility_SM0-13_26.04.2020_13_55_42.png/800px-Shubin_Mining_Facility_SM0-13_26.04.2020_13_55_42.png'
)

const SHUBIN_MINING_SM0_18 = new Location(
	'Shubin Mining Facility SM0-18',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : 920.210,
		'y' : -389.542,
		'z' : 43.837
	},
	null,
	'https://starcitizen.tools/images/thumb/a/a8/Shubin_Mining_Facility_SM0-18_26.04.2020_21_01_29.png/800px-Shubin_Mining_Facility_SM0-18_26.04.2020_21_01_29.png'
)

const SHUBIN_MINING_SM0_22 = new Location(
	'Shubin Mining Facility SM0-22',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : 24.299,
		'y' : -822.591,
		'z' : 568.174
	},
	null,
	'https://starcitizen.tools/images/thumb/8/85/Shubin_Mining_Facility_SM0-22_26.04.2020_13_36_06.png/800px-Shubin_Mining_Facility_SM0-22_26.04.2020_13_36_06.png'
)

const NECROPOLIS = new Location(
	'The Necropolis',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : 63.643,
		'y' : -162.085,
		'z' : 985.651
	},
	null,
	'https://starcitizen.tools/images/thumb/7/7d/The_Necropolis_27.04.2020_15_18_49.png/800px-The_Necropolis_27.04.2020_15_18_49.png'
)

const OUTPOST_54 = new Location(
	'Outpost 54',
	'Outpost',
	MICROTECH,
	STANTON,
	{
		'x' : 113.566,
		'y' : 14.479,
		'z' : -994.363
	},
	null,
	'https://starcitizen.tools/images/thumb/6/6b/Outpost_54_27.04.2020_18_28_35.png/800px-Outpost_54_27.04.2020_18_28_35.png'
)

const AFTERLIFE = new Location(
	'Afterlife',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : -254.067,
		'y' : -153.318,
		'z' : 99.652
	},
	null,
	'https://starcitizen.tools/images/thumb/2/2a/Afterlife_outpost%2C_Yela_%28Alpha_3.17%29.png/800px-Afterlife_outpost%2C_Yela_%28Alpha_3.17%29.png'
)

const NT_999_XXII = new Location(
	'NT-999-XXII',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 54.792,
		'y' : 55.827,
		'z' : -303.328
	},
	null,
	'https://starcitizen.tools/images/thumb/8/8d/NT-999-XXII_outpost_on_Yela_%28Alpha_3.17%29.png/800px-NT-999-XXII_outpost_on_Yela_%28Alpha_3.17%29.png'
)

const UTOPIA = new Location(
	'Utopia',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 0.106,
		'y' : -0.425,
		'z' : -313.108
	},
	null,
	'https://starcitizen.tools/images/thumb/3/3b/Utopia_underground_bunker%2C_Yela_%28Alpha_3.17%29.png/800px-Utopia_underground_bunker%2C_Yela_%28Alpha_3.17%29.png'
)

const NT_999_XV = new Location(
	'NT-999-XV',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 146.832,
		'y' : 135.254,
		'z' : 167.474
	},
	null,
	''
)

const HDMO_DOBBS_NA = new Location(
	'HDMO-Dobbs (NA)',
	'Cave',
	ABERDEEN,
	STANTON,
	{
		'x' : 270.579,
		'y' : 47.399,
		'z' : -11.404
	},
	null,
	'https://starcitizen.tools/images/thumb/c/c2/Aberdeen_HDMO-Dobbs_Day.jpg/800px-Aberdeen_HDMO-Dobbs_Day.jpg'
)

const BARTON_FLATS_AID_SHELTER = new Location(
	'Barton Flats Aid Shelter',
	'Emergency Shelter',
	ABERDEEN,
	STANTON,
	{
		'x' : 54.341,
		'y' : 217.120,
		'z' : -159.881
	},
	null,
	'https://starcitizen.tools/images/thumb/e/e9/Aberdeen_Barton-Flats-Aid-Shelter_Sunset.jpg/800px-Aberdeen_Barton-Flats-Aid-Shelter_Sunset.jpg'
)

const PRIVATE_PROPERTY = new Location(
	'PRIVATE PROPERTY',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 97.749,
		'y' : -173.764,
		'z' : 167.078
	},
	null,
	''
)

const SECURITY_POST_CRISKA = new Location(
	'Security Post Criska',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 252.522,
		'y' : 62.924,
		'z' : 13.871
	},
	null,
	''
)

const SECURITY_POST_DIPUR = new Location(
	'Security Post Dipur',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : 197.701,
		'y' : 57.544,
		'z' : -159.946
	},
	null,
	''
)

const SECURITY_POST_LESPIN = new Location(
	'Security Post Lespin',
	'Outpost',
	CELLIN,
	STANTON,
	{
		'x' : -214.319,
		'y' : -149.144,
		'z' : 3.974
	},
	null,
	''
)

const SECURITY_POST_KAREAH = new Location(
	'Security Post Kareah',
	'Space Station',
	CELLIN,
	STANTON,
	{
		'x' : 11.620,
		'y' : -419.839,
		'z' : 200.000
	},
	null,
	'https://starcitizen.tools/images/thumb/8/84/Crusader-cellin-kareah-3.11-exterior-03.jpg/800px-Crusader-cellin-kareah-3.11-exterior-03.jpg'
)

const ASHBURN_CHANNEL_AID_SHELTER = new Location(
	'Ashburn Channel Aid Shelter',
	'Emergency Shelter',
	CELLIN,
	STANTON,
	{
		'x' : 3.024,
		'y' : -257.942,
		'z' : -37.129
	},
	null,
	'https://starcitizen.tools/images/thumb/2/2c/Cellin_Ashburn-Channel-Aid-Shelter_Day.jpg/800px-Cellin_Ashburn-Channel-Aid-Shelter_Day.jpg'
)

const FLANAGANS_RAVINE_AID_SHELTER = new Location(
	'Flanagan\'s Ravine Aid Shelter',
	'Emergency Shelter',
	CELLIN,
	STANTON,
	{
		'x' : -194.282,
		'y' : 151.722,
		'z' : 84.997
	},
	null,
	'https://starcitizen.tools/images/thumb/0/00/Cellin_Flanagans-Ravine-Aid-Shelter_Day.jpg/800px-Cellin_Flanagans-Ravine-Aid-Shelter_Day.jpg'
)

const MOGOTE_AID_SHELTER = new Location(
	'Mogote Aid Shelter',
	'Emergency Shelter',
	CELLIN,
	STANTON,
	{
		'x' : -198.664,
		'y' : 50.790,
		'z' : 160.875
	},
	null,
	'https://starcitizen.tools/images/thumb/7/7b/Cellin_Mogote-Aid-Shelter-Day.jpg/800px-Cellin_Mogote-Aid-Shelter-Day.jpg'
)

const JULEP_RAVINE_AID_SHELTER = new Location(
	'Julep Ravine Aid Shelter',
	'Emergency Shelter',
	CELLIN,
	STANTON,
	{
		'x' : -111.528,
		'y' : -56.297,
		'z' : -228.950
	},
	null,
	'https://starcitizen.tools/images/thumb/f/f0/Cellin_Julep-Ravine-Aid-Shelter_Day.jpg/800px-Cellin_Julep-Ravine-Aid-Shelter_Day.jpg'
)

const DUNLOW_RIDGE_AID_SHELTER = new Location(
	'Dunlow Ridge Aid Shelter',
	'Emergency Shelter',
	DAYMAR,
	STANTON,
	{
		'x' : -51.850,
		'y' : 280.932,
		'z' : 75.331
	},
	null,
	'https://starcitizen.tools/images/thumb/b/b9/Daymar_Dunlow-Ridge-Aid-Shelter_Day.jpg/800px-Daymar_Dunlow-Ridge-Aid-Shelter_Day.jpg'
)

const EAGER_FLATS_AID_SHELTER = new Location(
	'Eager Flats Aid Shelter',
	'Emergency Shelter',
	DAYMAR,
	STANTON,
	{
		'x' : 200.545,
		'y' : -104.917,
		'z' : 190.097
	},
	null,
	'https://starcitizen.tools/images/thumb/2/26/Daymar_Eager-Flats-Aid-Shelter_Day.jpg/800px-Daymar_Eager-Flats-Aid-Shelter_Day.jpg'
)

const TAMDON_PLAINS_AID_SHELTER = new Location(
	'Tamdon Plains Aid Shelter',
	'Emergency Shelter',
	DAYMAR,
	STANTON,
	{
		'x' : -138.114,
		'y' : -24.463,
		'z' : -259.849
	},
	null,
	'https://starcitizen.tools/images/thumb/3/33/Daymar_Tamdon-Plains-Aid-Shelter_Day.jpg/800px-Daymar_Tamdon-Plains-Aid-Shelter_Day.jpg'
)

const WOLF_POINT_AID_SHELTER = new Location(
	'Wolf Point Aid Shelter',
	'Emergency Shelter',
	DAYMAR,
	STANTON,
	{
		'x' : -4.420,
		'y' : 279.067,
		'z' : 95.733
	},
	null,
	'https://starcitizen.tools/images/thumb/5/54/20180325093227_1.jpg/800px-20180325093227_1.jpg'
)

const SECURITY_POST_MOLUTO = new Location(
	'Security Post Moluto',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : 189.063,
		'y' : 33.693,
		'z' : -223.998
	},
	null,
	''
)

const SECURITY_POST_PRASHAD = new Location(
	'Security Post Prashad',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : -223.514,
		'y' : 65.899,
		'z' : 181.092
	},
	null,
	''
)

const SECURITY_POST_THAQURAY = new Location(
	'Security Post Thaquray',
	'Outpost',
	DAYMAR,
	STANTON,
	{
		'x' : -6.477,
		'y' : -90.411,
		'z' : 281.124
	},
	null,
	''
)

const COVALEX_SHIPPING_HUB_GUNDO = new Location(
	'Covalex Shipping Hub Gundo',
	'Space Station',
	DAYMAR,
	STANTON,
	{
		'x' : -241.198,
		'y' : 437.977,
		'z' : -300.000
	},
	null,
	'https://starcitizen.tools/images/thumb/d/da/Stanton-crusader-daymar-gundo-3.8.0.jpg/800px-Stanton-crusader-daymar-gundo-3.8.0.jpg'
)

const SECURITY_POST_OPAL = new Location(
	'Security Post Opal',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : 241.090,
		'y' : 96.618,
		'z' : -174.893
	},
	null,
	''
)

const SECURITY_POST_WAN = new Location(
	'Security Post Wan',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : -208.492,
		'y' : 53.177,
		'z' : -227.351
	},
	null,
	''
)

const CONNORS = new Location(
	'Connor\'s',
	'Outpost',
	YELA,
	STANTON,
	{
		'x' : -139.095,
		'y' : -254.344,
		'z' : 119.068
	},
	null,
	''
)

const BENNYHENGE = new Location(
	'Bennyhenge',
	'Landmark',
	YELA,
	STANTON,
	{
		'x' : -626.649,
		'y' : 135.683,
		'z' : -1.819
	},
	null,
	''
)

// INIT
window.LOCATIONS.sort((a, b) => a.NAME.localeCompare(b.NAME));
populateLocationList();
loadSettings();
setInterval(update, 250);
update();