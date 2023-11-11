import { calculateDistance3D } from '../HelperFunctions.js';
import DB from './app/Database.js';

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

		this.DISTANCE = calculateDistance3D(
			system1.COORDINATES.x,
			system1.COORDINATES.y,
			system1.COORDINATES.z,
			system2.COORDINATES.x,
			system2.COORDINATES.y,
			system2.COORDINATES.z,
			false
		);

		DB.wormholes.push(this);
	}
}