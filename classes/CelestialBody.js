import { degrees, modulo, square, getJulianDate, calculateDistance2D } from '../HelperFunctions.js';
import DB from './app/Database.js';

export default class CelestialBody {
	constructor(name, type, parentBody, parentStar, coordinates, rotationQuaternion, bodyRadius, rotationRate, rotationCorrection, orbitalAngle, orbitalRadius, themeColor = null, themeImage = null) {
		this.NAME = name;
		this.TYPE = type;
		this.PARENT = parentBody;
		this.PARENT_STAR = parentStar;
		this.COORDINATES = coordinates;
		this.ROTATION_QUATERNION = rotationQuaternion;
		this.BODY_RADIUS = bodyRadius;
		this.ROTATION_RATE = rotationRate;
		this.LENGTH_OF_DAY = 3600 * this.ROTATION_RATE / 86400;
		this.ANGULAR_ROTATION_RATE = 6 / this.ROTATION_RATE;
		this.ROTATION_CORRECTION = rotationCorrection;

		// CURRENTLY NOT USED BY TIME CALCULATIONS:
		// this.ORBITAL_ANGLE = orbitalAngle;
		// this.ORBITAL_ANGLE = this.PARENT ? Math.atan( (coordinates.y - this.PARENT.COORDINATES.y) / (coordinates.x - this.PARENT.COORDINATES.x) ) : 0;

		if (parseFloat(orbitalRadius) === 0) {
			this.ORBITAL_RADIUS = (this.PARENT && this.PARENT.COORDINATES) ? this.#calculateOrbitalRadius() : 0;
		} else {
			this.ORBITAL_RADIUS = orbitalRadius;
		}

		this.THEME_COLOR = themeColor ? themeColor : {'r' : null, 'g' : null, 'b' : null};
		this.THEME_IMAGE = themeImage;

		this.RING = null;

		DB.bodies.push(this);
	}

	BS_INTERNAL(direction, distantObject) {
		if (
			direction !== 'x' &&
			direction !== 'y' &&
			direction !== 'z'
		) {
			throw 'Wrong axis value passed to function: ' + direction;
			return null;
		}

		const qw = this.ROTATION_QUATERNION.w;
		const qx = this.ROTATION_QUATERNION.x;
		const qy = this.ROTATION_QUATERNION.y;
		const qz = this.ROTATION_QUATERNION.z;

		const sx = distantObject.COORDINATES.x;
		const sy = distantObject.COORDINATES.y;
		const sz = distantObject.COORDINATES.z;

		const bx = this.COORDINATES.x;
		const by = this.COORDINATES.y;
		const bz = this.COORDINATES.z;

		let part1, part2, part3;

		if (direction === 'x') {
            part1 = ((1 - (2 * square(qy)) - (2 * square(qz))) * (sx - bx));
            part2 = (((2 * qx * qy) - (2 * qz * qw)) * (sy - by));
            part3 = (((2 * qx * qz) + (2 * qy * qw)) * (sz - bz));
		
		} else if (direction === 'y') {
            part1 = ((2 * qx * qy) + (2 * qz * qw)) * (sx - bx);
            part2 = (1 - (2 * square(qx)) - (2 * square(qz))) * (sy - by);
            part3 = ((2 * qy * qz) - (2 * qx * qw)) * (sz - bz);

		} else if (direction === 'z') {
            part1 = (((2 * qx * qz) - (2 * qy * qw)) * (sx - bx));
            part2 = (((2 * qy * qz) + (2 * qx * qw)) * (sy - by));
            part3 = ((1 - (2 * square(qx)) - (2 * square(qy))) * (sz - bz));
		}

		return part1 + part2 + part3;
	}

	BS(distantObject) {
		// Recenter coorinate system on the current celestial body
		// distantObject is the origin point before the transformation
		const x = this.BS_INTERNAL('x', distantObject);
		const y = this.BS_INTERNAL('y', distantObject);
		const z = this.BS_INTERNAL('z', distantObject);

		return {'x': x, 'y': y, 'z': z};
	}
	

	DECLINATION(distantObject = this.PARENT_STAR) {
		const bs = this.BS(distantObject);

		const squareX = square(bs.x);
		const squareY = square(bs.y);
		const squareZ = square(bs.z);

		const sumXYZ = squareX + squareY + squareZ;
		const sumXY = squareX + squareY;

		//let chunk1 = Math.sqrt( sumXYZ );
		//chunk1 = Math.pow(chunk1, 2);
		//let chunk2 = Math.sqrt( square(bs.x) + square(bs.y) );
		//chunk2 = Math.pow(chunk2, 2);
		//const part1 = chunk1 + chunk2 - squareZ;

		const part1 = sumXYZ + sumXY - squareZ;

		const chunk3 = Math.sqrt( sumXYZ );
		const chunk4 = Math.sqrt( sumXY );
		const part2 = 2 * chunk3 * chunk4;

		const result = Math.acos(part1 / part2);
		return Math.abs(degrees(result));
	}

	APPARENT_RADIUS(distantObject) {
		const bs = this.BS(distantObject);

		const p4 = square(bs.x) + square(bs.y) + square(bs.z);
		const p3 = Math.sqrt(p4);
		const p2 = distantObject.BODY_RADIUS / p3;
		const p1 = Math.asin(p2);
		return degrees(p1);
	}

	CURRENT_CYCLE() {
		// How many times the object has rotated since the 2020 reference date
		if (this.LENGTH_OF_DAY === 0) {
			return 0;
		} else {
			return getJulianDate() / this.LENGTH_OF_DAY;
		}
	}

	HOUR_ANGLE() {
		// Current Rotation
		const cycle = this.CURRENT_CYCLE();

		const correction = this.ROTATION_CORRECTION;
		const result = modulo((360 - modulo(cycle, 1) * 360 - correction), 360)
		return result;
	}

	MERIDIAN(distantObject = this.PARENT_STAR) {
		// Position of distantObject if this celestial object didn't rotate
		const bs = this.BS(distantObject);

		const p2 = Math.atan2(bs.y, bs.x) - (Math.PI / 2);
		const p1 = modulo(p2, 2 * Math.PI);
		return degrees(p1);
	}

	LONGITUDE(distantObject = this.PARENT_STAR) {
		const meridModulo = modulo(0 - this.MERIDIAN(distantObject), 360);
		const cycleHourAngle = this.HOUR_ANGLE();

		let condition = cycleHourAngle - meridModulo;
		if (condition > 180) {
			return cycleHourAngle - meridModulo - 360;

		} else {
			const subtotal = cycleHourAngle - meridModulo;

			if (subtotal < -180) {
				return subtotal + 360;

			} else {
				return subtotal;
			}
		}
	}

	#calculateOrbitalRadius() {
		return calculateDistance2D(this.COORDINATES.x, this.COORDINATES.y, this.PARENT.COORDINATES.x, this.PARENT.COORDINATES.y);
	}
}