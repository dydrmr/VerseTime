let SIZE = null;
let SYSTEM1 = null;
let SYSTEM2 = null;
let POSITION1 = null;
let POSITION2 = null;

export default class Wormhole {

	constructor(size, system1, system2, x1, y1, z1, x2, y2, z2) {
		this.SIZE = size;
		this.SYSTEM1 = system1;
		this.SYSTEM2 = system2;

		this.POSITION1 = {
			'x': x1,
			'y': y1,
			'z': z1
		}
		this.POSITION2 = {
			'x': x2,
			'y': y2,
			'z': z2
		}

		window.WORMHOLES.push(this);
	}
}