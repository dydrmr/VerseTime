import * as THREE from 'three';
import Settings from './classes/app/Preferences.js';
import DB from './classes/app/Database.js';

export function degrees(rad) {
	return (rad * 180) / Math.PI;
}

export function radians(deg) {
	return deg * (Math.PI / 180);
}

export function modulo(dividend, divisor) {
	return (dividend % divisor + divisor) % divisor;
}

export function square(number) {
	return number * number;
}

export function round(n, digits) {
	if (digits === undefined) {
		digits = 0;
	}

	let multiplicator = Math.pow(10, digits);
	n = parseFloat((n * multiplicator).toFixed(11));
	let test = (Math.round(n) / multiplicator);
	return +(test.toFixed(digits));
}

export function CHOSEN_TIME() {
	let unix = parseInt(Settings.customTime);
	if(Number.isInteger(unix)) {
		return new Date(unix * 1000);
	}
	return new Date();
}

export function REAL_TIME(formatAsString = false) {
	let now = new Date();
	return (!formatAsString) ? now.valueOf() : now.toLocaleString();
}

export function JULIAN_DATE() {
	let date2020 = new Date('2020-01-01T00:00:00.000Z');
	let now = CHOSEN_TIME();
	let julian = now - date2020;
	return julian / 1000 / 60 / 60 / 24;
}

export function HOURS_TO_TIME_STRING(hours, includeSeconds = true, limitTo24Hours = true) {
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
	if (limitTo24Hours && !Settings.use24HourTime) {
		ampm = ' ' + GET_AM_PM(h);
		h = CONVERT_24H_TO_12H(h);
	}

	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;
	s = (s < 10) ? '0' + s : s;

	return h + ':' + m + (includeSeconds ? ':' + s : '') + ampm;
}

export function DATE_TO_SHORT_TIME(date) {
	let h = date.getHours();
	let m = date.getMinutes();

	let ampm = '';
	if (!Settings.use24HourTime) {
		ampm = ' ' + GET_AM_PM(h);
		h = CONVERT_24H_TO_12H(h);
	}

	h = (h < 10) ? '0' + h : h;
	m = (m < 10) ? '0' + m : m;

	return h + ':' + m + ampm;
}

export function GET_AM_PM(hour) { return (hour < 12) ? 'am' : 'pm'; }

export function CONVERT_24H_TO_12H(hour) {
	if (hour > 12) hour -= 12;
	if (hour === 0) hour = 12;
	return hour;
}

export function UNIVERSE_TIME(formatAsString = false) {
	let date2020 = new Date('January 1, 2020 00:00:00Z');
	let date2950 = new Date('January 1, 2950 00:00:00Z');
	let universeTime = date2950.getTime() + ((CHOSEN_TIME() - date2020) * 6);
	return (!formatAsString) ? universeTime : new Date(universeTime).toUTCString();
}

export function POLAR_TO_CARTESIAN(horizontalAngle, verticalAngle, radius) {
	const radH = radians(horizontalAngle);
	const radV = radians(verticalAngle);

	const x = Math.cos(radH) * Math.sin(radV) * radius;
	const y = Math.cos(radV) * radius;
	const z = Math.sin(radH) * Math.sin(radV) * radius;

	return {x: x, y: y, z: z};
}

export function random(min, max) {
	let rand = Math.random();

	if (typeof min === 'undefined') {
		return rand;

	} else if (typeof max === 'undefined') {
		if (min instanceof Array) {
			return min[Math.floor(rand * min.length)];
		} else {
			return rand * min;
		}

	} else {
		if (min > max) {
			const tmp = min;
			min = max;
			max = tmp;
		}
	}

	return rand * (max - min) + min;
}

export function calculateDistance2D(x1, y1, x2, y2) {
	const a = x2 - x1;
	const b = y2 - y1;
	return Math.sqrt((a * a) + (b * b));
}

export function calculateDistance3D(x1, y1, z1, x2, y2, z2, squared = false) {
	const x = parseFloat(x2) - parseFloat(x1);
	const y = parseFloat(y2) - parseFloat(y1);
	const z = parseFloat(z2) - parseFloat(z1);

	let sum = (x * x) + (y * y) + (z * z);
	return squared ? sum : Math.sqrt(sum);
}

export function calculateGreatCircleDistance(x1, y1, z1, x2, y2, z2, radius) {
	// Convert coordinates to latitude and longitude
	const lat1 = Math.asin(z1 / radius);
	const lon1 = Math.atan2(y1, x1);
	const lat2 = Math.asin(z2 / radius);
	const lon2 = Math.atan2(y2, x2);

	// Haversine formula
	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;

	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.asin(Math.sqrt(a));

	return radius * c;
}

export function makeLine(x1, y1, z1, x2, y2, z2, mat) {
	const p = [];
	p.push(new THREE.Vector3(x1, y1, z1));
	p.push(new THREE.Vector3(x2, y2, z2));
	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const line = new THREE.Line(geo, mat);
	return line;
}

export function makeCircle(radius, detail, centerX, centerY, centerZ, rotationX, rotationY, rotationZ, material) {
	const p = [];

	for (let i = 0; i <= 360; i += 360 / detail) {
		let rad = radians(i);

		let x = Math.sin(rad) * radius;
		let y = Math.cos(rad) * radius;
		let z = 0;

		x += centerX;
		y += centerY;
		z += centerZ;

		p.push(new THREE.Vector3(x, y, z));
	}

	// TODO: rotation X, Y, Z

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);

	return circle;
}

export function getHashedLocation() {
	let loc = Settings.activeLocation?.NAME;
	if (loc !== undefined) {
		loc = loc.replaceAll(' ', '_');
	}
	return loc;
}

export function getHashedCustomTime() {
	if (Settings.customTime != 'now') {
		return '@' + Settings.customTime;
	}
	return '';
}

export function getHash() {
	let loc = getHashedLocation() + getHashedCustomTime()
	return loc.replaceAll(' ', '_');
}

export function getCelestialBodiesInSystem(systemName) {
	const bodies = DB.bodies.filter(body => {
		if (
			body.NAME === systemName ||
			body.PARENT_STAR && body.PARENT_STAR.NAME === systemName
		) {
			return true;
		}
	});
	return bodies;
}

export function getLocationsInSystem(systemName) {
	const locations = DB.locations.filter(loc => loc.PARENT_STAR.NAME === systemName);
	return locations;
}

export function getSystemByName(string) {
	const result = DB.systems.filter(sys => sys.NAME === string);

	if (result.length === 0) {
		console.error(`System "${string}" not found.`);
		return null;
	}

	return result[0];
}

export function getBodyByName(string) {
	const result = DB.bodies.filter(bod => bod.NAME === string);

	if (result.length === 0) {
		console.error(`Body "${string}" not found.`);
		return null;
	}

	return result[0];
}

export function getLocationByName(string) {
	const result = DB.locations.filter(loc => loc.NAME === string);

	if (result.length === 0) {
		console.error(`Location "${string}" not found.`);
		return null;
	}

	return result[0];
}

export function readableNumber(number, unitString) {
	let unitScalar = null;
	let newNumber = null;

	if (number > 1000000000000) {
		newNumber = number / 1000000000000;
		unitScalar = 'T';

	} else if (number > 1000000000) {
		newNumber = number / 1000000000;
		unitScalar = 'G';

	} else if (number > 1000000) {
		newNumber = number / 1000000;
		unitScalar = 'M';

	} else if (number > 1000) {
		newNumber = number / 1000;
		unitScalar = 'k';

	} else {
		newNumber = number;
		unitScalar = '';
	}

	return `${newNumber.toFixed(2)} ${unitScalar}${unitString}`;
}