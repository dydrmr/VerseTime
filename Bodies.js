import CelestialBody from './CelestialBody.js';
let BODIES = Array();

export default class BODIES {
	constructor() {
		BODIES.push(ARCCORP, CRUSADER, HURSTON, MICROTECH);
	}
}

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
	28917272.576
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
	19148527.616
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
	43443216.384
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
	12850457.600
);
