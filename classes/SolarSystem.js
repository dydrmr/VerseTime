import DB from './app/Database.js';

export default class SolarSystem {

	constructor(name, coordinateX, coordinateY, coordinateZ, affiliation) {
		this.NAME = name;
		this.COORDINATES = {
			'x': parseFloat(coordinateX),
			'y': parseFloat(coordinateY),
			'z': parseFloat(coordinateZ)
		}
		this.AFFILIATION = affiliation;

		DB.systems.push(this);
	}
}