import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE } from './HelperFunctions.js';
import CelestialBody from './CelestialBody.js';
import Location from './Location.js';

window.BODIES = Array();
window.LOCATIONS = Array();
window.ACTIVE_LOCATION = null;
window.SETTING_24HR = true;

window.DEBUG_MODE = false;


setInterval( update, 300 );
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
	setText('local-time', HOURS_TO_TIME_STRING(location.LOCAL_TIME/60/60, false));
	setText('location-name', location.NAME);
	setText('location-body-name', location.PARENT.NAME);
	// setText('location-body-type', location.PARENT.TYPE);


	// RISE/SET COUNTDOWNS
	setText('local-rise-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_RISE_TIME * 24, false, true));
	setText('local-set-time', HOURS_TO_TIME_STRING(location.LOCAL_STAR_SET_TIME * 24, false, true));

	let nextRise = location.NEXT_STAR_RISE;
	let nextSet = location.NEXT_STAR_SET;
	nextRise = (location.NEXT_STAR_RISE * 86400 < 120) ? '- NOW -' : HOURS_TO_TIME_STRING(nextRise * 24, true, false);
	nextSet = (location.NEXT_STAR_SET * 86400 < 120) ? '- NOW -' : HOURS_TO_TIME_STRING(nextSet * 24, true, false);
	setText('next-rise-countdown', nextRise);
	setText('next-set-countdown', nextSet);


	// RISE/SET REAL TIMES
	let now = new Date();
	let rise = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 86400));
	if (new Date(rise).getSeconds() === 59) rise = new Date(rise.getTime() + 1000);
	setText('next-rise-time', DATE_TO_SHORT_TIME(new Date(rise)));

	now = new Date();
	let set = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 86400));
	if (new Date(set).getSeconds() === 59) set = new Date(set.getTime() + 1000);
	setText('next-set-time', DATE_TO_SHORT_TIME(new Date(set)));


	if (window.DEBUG_MODE) updateDebugUI();	
}

function updateDebugUI() {
	let location = window.ACTIVE_LOCATION;
	let body = window.ACTIVE_LOCATION ? window.ACTIVE_LOCATION.PARENT : null;

	//UNIX TIME
	let unix = Math.floor(REAL_TIME() / 1000);
	let fragments = unix.toString().split('').reverse();
	let newFragments = Array();
	fragments.forEach((element, index) => {
		if (index != 0 && index % 3 === 0) { newFragments.push('&thinsp;'); }
		newFragments.push(element);
	});
	let unixWithSpaces = newFragments.reverse().join('');
	document.getElementById('unix-time').innerHTML = 'UNIX time: ' + unixWithSpaces;

	//CELESTIAL BODY
	if (body) {
		document.getElementById('body-name').innerHTML = body.NAME;
		document.getElementById('day-length').innerHTML = (body.ROTATION_RATE*60*60).toFixed(0);
		document.getElementById('day-length-readable').innerHTML = HOURS_TO_TIME_STRING(body.ROTATION_RATE);
		document.getElementById('current-cycle').innerHTML = body.CURRENT_CYCLE().toFixed(5);
		document.getElementById('hour-angle').innerHTML = body.HOUR_ANGLE().toFixed(3);
		document.getElementById('declination').innerHTML = body.DECLINATION(body.PARENT_STAR).toFixed(3);
		document.getElementById('meridian').innerHTML = body.MERIDIAN().toFixed(3);
		document.getElementById('noon-longitude').innerHTML = body.LONGITUDE().toFixed(3);
	}

	//LOCATION
	document.getElementById('db-local-name').innerHTML = location.NAME;
	document.getElementById('db-local-time').innerHTML = HOURS_TO_TIME_STRING(location.LOCAL_TIME/60/60);

	let latitude = location.LATITUDE.toFixed(3);
	if (parseFloat(latitude) < 0) {
		latitude = 'S ' + (parseFloat(latitude) * -1).toFixed(3);
	} else {
		latitude = 'N ' + latitude;
	}
	document.getElementById('latitude').innerHTML = latitude;

	let longitude = location.LONGITUDE.toFixed(3);
	if (parseFloat(longitude) < 0) {
		longitude = 'W ' + (parseFloat(longitude) * -1).toFixed(3);
	} else {
		longitude = 'E ' + longitude;
	}
	document.getElementById('longitude').innerHTML = longitude;

	document.getElementById('longitude-360').innerHTML = ROUND(location.LONGITUDE_360, 3);
	document.getElementById('elevation').innerHTML = (location.ELEVATION * 1000).toFixed(1);
	document.getElementById('elevation-degrees').innerHTML = location.ELEVATION_IN_DEGREES.toFixed(3);
	document.getElementById('sunriseset-angle').innerHTML = location.STARRISE_AND_STARSET_ANGLE.toFixed(3);
	document.getElementById('length-of-daylight').innerHTML = HOURS_TO_TIME_STRING(location.LENGTH_OF_DAYLIGHT * 24, true, false);
	document.getElementById('daylight-percent').innerHTML = HOURS_TO_TIME_STRING((body.ROTATION_RATE) - (location.LENGTH_OF_DAYLIGHT *24), true, false);
	document.getElementById('starrise-time').innerHTML = HOURS_TO_TIME_STRING(location.LOCAL_STAR_RISE_TIME*24);
	document.getElementById('starset-time').innerHTML = HOURS_TO_TIME_STRING(location.LOCAL_STAR_SET_TIME*24);
	document.getElementById('hour-angle-location').innerHTML = location.HOUR_ANGLE().toFixed(3) + '&deg;';
	document.getElementById('star-azimuth').innerHTML = location.STAR_AZIMUTH().toFixed(3) + '&deg;';
	document.getElementById('star-altitude').innerHTML = location.STAR_ALTITUDE().toFixed(3) + '&deg;';
	document.getElementById('max-star-altitude').innerHTML = location.STAR_MAX_ALTITUDE().toFixed(3) + '&deg;';

	let now = new Date();
	now.setMilliseconds(0);
	let next = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_RISE * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	let remain = HOURS_TO_TIME_STRING(location.NEXT_STAR_RISE * 24, true, false);
	document.getElementById('db-next-starrise').innerHTML = (location.NEXT_STAR_RISE * 24 * 60 * 60).toFixed(0);
	document.getElementById('db-next-starrise-countdown').innerHTML = remain;
	document.getElementById('db-next-starrise-date').innerHTML = next;

	now = new Date();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (location.NEXT_NOON * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(location.NEXT_NOON * 24, true, false);
	document.getElementById('next-noon').innerHTML = (location.NEXT_NOON * 24 * 60 * 60).toFixed(0);
	document.getElementById('next-noon-countdown').innerHTML = remain;
	document.getElementById('next-noon-date').innerHTML = next;	

	now = new Date();
	now.setMilliseconds(0);
	next = now.setSeconds(now.getSeconds() + (location.NEXT_STAR_SET * 24 * 60 * 60));
	next = new Date(next).toLocaleString();
	remain = HOURS_TO_TIME_STRING(location.NEXT_STAR_SET * 24, true, false);
	document.getElementById('db-next-starset').innerHTML = (location.NEXT_STAR_SET * 24 * 60 * 60).toFixed(0);
	document.getElementById('db-next-starset-countdown').innerHTML = remain;
	document.getElementById('db-next-starset-date').innerHTML = next;
}

function setText(elementID, string) {
	let el = document.getElementById(elementID);

	if (!el) {
		throw 'Invalid [ elementID] passed to [ setText ] function!';
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

	if (limitTo24Hours) { if (h > 24) h -= 24; }
	
	let ampm = '';
	if (limitTo24Hours) {
		if (!window.SETTING_24HR) {
			ampm = ' ' + GET_AM_PM(h);
			if (h >= 12 ) h -= 12;
			if (h === 0) h = 12;
		}
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
		if (h >= 12) h -= 12;
		if (h === 0) h = 12;
	}

	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;

	return h + ':' + m + ampm;
}

function GET_AM_PM(hour) { return (hour < 12) ? 'am' : 'pm'; }



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
);

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
);

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
);

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
	}
);

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
);

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
);


// LOCATIONS
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
	'https://starcitizen.tools/images/thumb/c/c3/Arccorp-area18-skyline-io-north-tower.jpg/1280px-Arccorp-area18-skyline-io-north-tower.jpg'
);

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
	'https://starcitizen.tools/images/thumb/0/09/Star_Citizen_-_GrimHEX_close-up.png/1280px-Star_Citizen_-_GrimHEX_close-up.png'
);

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
	'https://starcitizen.tools/images/4/42/Hurston.jpg'
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
	'https://starcitizen.tools/images/thumb/9/9c/Microtech-new-babbage-cityscape-01.jpg/1280px-Microtech-new-babbage-cityscape-01.jpg'
);

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
	'https://starcitizen.tools/images/thumb/c/cf/Crusader-orison-voyager-bar-lookout-daytime-3.14.jpg/1280px-Crusader-orison-voyager-bar-lookout-daytime-3.14.jpg'
)

loadSettings();
console.log(window.ACTIVE_LOCATION);
update();