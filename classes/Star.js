import DB from './app/Database.js';

export default class Star {

	constructor(name, parentSystem, coordinateX, coordinateY, coordinateZ, bodyRadius) {
		this.NAME = name;
		this.PARENT_SYSTEM = parentSystem;
		this.COORDINATES = {
			'x': parseFloat(coordinateX),
			'y': parseFloat(coordinateY),
			'z': parseFloat(coordinateZ)
		}
		this.BODY_RADIUS = bodyRadius

		DB.stars.push(this);
	}
}