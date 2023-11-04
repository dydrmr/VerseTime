let NAME = '[NOT INITIALIZED]';
let COORDINATES = {
	'x': null,
	'y': null,
	'z': null
};

export default class SolarSystem {

	constructor(name, coordinateX, coordinateY, coordinateZ) {
		this.NAME = name;
		this.COORDINATES = {
			'x': parseFloat(coordinateX),
			'y': parseFloat(coordinateY),
			'z': parseFloat(coordinateZ)
		}

		window.SYSTEMS.push(this);
	}
}