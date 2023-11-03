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

export function CHOSEN_TIME() {
	let unix = parseInt(window.CHOSEN_TIME);
	if(Number.isInteger(unix)) {
		return new Date(unix * 1000);
	}
	return new Date();
}

export function JULIAN_DATE() {
	let date2020 = new Date('2020-01-01T00:00:00.000Z');
	let now = CHOSEN_TIME();
	let julian = now - date2020;
	return julian / 1000 / 60 / 60 / 24;
}

export function POLAR_TO_CARTESIAN(horizontalAngle, verticalAngle, radius) {
	let radH = RADIANS(horizontalAngle);
	let radV = RADIANS(verticalAngle);

	let x = Math.cos(radH) * Math.sin(radV) * radius;
	let y = Math.cos(radV) * radius;
	let z = Math.sin(radH) * Math.sin(radV) * radius;

	return {x: x, y: y, z: z};
}

export function RANDOM(min, max) {
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

export function GREAT_CIRCLE_DISTANCE(x1, y1, z1, x2, y2, z2, radius) {
	// Convert X, Y, Z coordinates to latitude and longitude
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