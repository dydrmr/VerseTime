let NAME = '[name not defined]';
let TYPE = '[type not defined]';
let PARENT = null;
let PARENT_STAR = null;
let COORDINATES = {
	'x' : null,
	'y' : null,
	'z' : null
};
let ROTATION_QUATERNION = {
	'w' : null,
	'x' : null,
	'y' : null,
	'z' : null
};
let BODY_RADIUS = null;
let ROTATION_RATE = null;
let ROTATION_CORRECTION = null;
let ORBITAL_ANGLE = null;
let ORBITAL_RADIUS = null;

export function DEGREES(rad) {
	return (rad * 180) / Math.PI;
}

export function RADIANS(deg) {
	return deg * (Math.PI / 180);
}

export function MODULO(dividend, divisor) {
	return (dividend % divisor + divisor) % divisor;
}

export function SQUARE(number) {
	return number * number;
}

export function ROUND(n, digits) {
	if (digits === undefined) {
		digits = 0;
	}

	let multiplicator = Math.pow(10, digits);
	n = parseFloat((n * multiplicator).toFixed(11));
	let test = (Math.round(n) / multiplicator);
	return +(test.toFixed(digits));
}

export function JULIAN_DATE() {
	let date2020 = new Date('2020-01-01T00:00:00.000Z');
	let now = new Date();
	let julian = now - date2020;
	return julian / 1000 / 60 / 60 / 24;
}