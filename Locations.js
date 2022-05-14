import CelestialBody from './CelestialBody.js';
import Location from './Locations.js';
import * as BODIES from './Bodies.js';

let LOCATIONS = Array();

export const AREA18 = new Location(
	'Area18',
	'Landing Zone',
	BODIES.ARCCORP,
	BODIES.STANTON,
	{
		'x' : -747.409,
		'y' : -116.734,
		'z' : -262.094
	}
);

export const LORVILLE = new Location(
	'Lorville',
	'Landing Zone',
	BODIES.HURSTON,
	BODIES.STANTON,
	{
		'x' : -328.989,
		'y' : -752.435,
		'z' : 572.120
	}
);

export const NEW_BABBAGE = new Location(
	'New Babbage',
	'Landing Zone',
	BODIES.MICROTECH,
	BODIES.STANTON,
	{
		'x' : 520.723,
		'y' : 419.364,
		'z' : 743.655
	}
);

export const ORISON = new Location(
	'Orison',
	'Landing Zone',
	BODIES.CRUSADER,
	BODIES.STANTON,
	{
		'x' : 5295.517,
		'y' : -863.194,
		'z' : 5282.237
	}
)

LOCATIONS.push(AREA18, LORVILLE);//, NEW_BABBAGE, ORISON);
export default function init() {return LOCATIONS;}