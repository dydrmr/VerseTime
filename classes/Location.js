import { degrees, radians, modulo, square } from '../HelperFunctions.js';
import * as THREE from 'three';
import DB from './app/Database.js';

export default class Location {
	constructor(name, type, parentBody, parentStar, coordinates, themeColor = null, wikiLink = null) {
		this.NAME = name;
		this.TYPE = type;
		this.PARENT = parentBody;
		this.PARENT_STAR = parentStar;
		this.COORDINATES = coordinates;

		this.TERRAIN_RISE = 0;
		this.TERRAIN_SET = 0;

		this.THEME_COLOR = themeColor ?? this.PARENT.THEME_COLOR;
		//this.THEME_IMAGE = (themeImage === '' || themeImage === null) ? this.PARENT.THEME_IMAGE : themeImage;
		this.THEME_IMAGE = this.PARENT.THEME_IMAGE;
		this.WIKI_LINK = (wikiLink === '' || wikiLink === null) ? null : wikiLink;

		// CALCULATED PROPERTIES
		this.#calculateLatitudeAndLongitude();
		this.#calculateLongitude360();
		this.#calculateElevation();
		this.#calculateRiseSetAngle();
		this.#calculate3dMapCoordinates();

		// FINALIZATION
		DB.locations.push(this);
	}

	#calculateLatitudeAndLongitude() {
		// LATITUDE
		const lat2 = Math.sqrt(square(this.COORDINATES.x) + square(this.COORDINATES.y));
		const lat1 = Math.atan2(this.COORDINATES.z, lat2);
		this.LATITUDE = degrees(lat1);

		// LONGITUDE
		if (Math.abs(this.LATITUDE) === 90) {
			this.LONGITUDE = 0;

		} else {
			const atan2 = Math.atan2(this.COORDINATES.y, this.COORDINATES.x);
			const condition = degrees(modulo(atan2, 2 * Math.PI));

			if (condition > 180) {
				this.LONGITUDE = -(360 - condition);
			} else {
				this.LONGITUDE = condition;
			}
		}
	}

	#calculateLongitude360() {
		if (Math.abs(this.LATITUDE) === 90) {
			this.LONGITUDE_360 = 0;

		} else {
			const x = this.COORDINATES.x;
			const y = this.COORDINATES.y;

			const p2 = Math.atan2(y, x);
			const p1 = modulo(p2, 2 * Math.PI);

			this.LONGITUDE_360 = degrees(p1);
		}
	}

	#calculateElevation() {
		// ELEVATION
		const x = square(this.COORDINATES.x);
		const y = square(this.COORDINATES.y);
		const z = square(this.COORDINATES.z);
		this.ELEVATION = Math.sqrt(x + y + z) - this.PARENT.BODY_RADIUS;

		// ELEVATION IN DEGREES
		const p3 = this.ELEVATION < 0 ? 0 : this.ELEVATION;
		const p2 = this.PARENT.BODY_RADIUS + p3;
		const p1 = Math.acos(this.PARENT.BODY_RADIUS / p2);
		this.ELEVATION_IN_DEGREES = degrees(p1);
	}

	#calculateRiseSetAngle() {
		const p4 = Math.tan(radians(this.PARENT.DECLINATION(this.PARENT_STAR)));
		const p3 = Math.tan(radians(this.LATITUDE));
		const p2 = -p3 * p4;
		const p1 = Math.acos(p2);
		this.STARRISE_AND_STARSET_ANGLE = degrees(p1) + this.PARENT.APPARENT_RADIUS(this.PARENT_STAR) + this.ELEVATION_IN_DEGREES;
	}

	#calculate3dMapCoordinates() {
		// NORMALIZED COORDINATES FOR 3D MAP
		let x = -this.COORDINATES.x / this.PARENT.BODY_RADIUS; // -x adjusts for rotation direction in local 3D map
		let y = this.COORDINATES.y / this.PARENT.BODY_RADIUS;
		let z = this.COORDINATES.z / this.PARENT.BODY_RADIUS;
		const vec = new THREE.Vector3(x, y, z);

		// IF ELEVATION IS NEGATIVE: PUSH COORDINATE TO SURFACE
		if (vec.length() < 1) {
			vec.normalize();
			x = vec.x;
			y = vec.y;
			z = vec.z;
		}

		this.COORDINATES_3DMAP = {
			'x': x,
			'y': y,
			'z': z
		}
	}

	HOUR_ANGLE() {
		const subResult = modulo(this.LONGITUDE_360 - this.PARENT.STATIC_MERIDIAN(), 360);
		const result = modulo(this.PARENT.HOUR_ANGLE() - subResult, 360);
		return (result > 180) ? result - 360 : result;
	}

	STAR_MAX_ALTITUDE() {
		let coords = this.COORDINATES;
		let bs = this.PARENT.BS(this.PARENT_STAR);

		let rootCoord = Math.sqrt(square(coords.x) + square(coords.y) + square(coords.z));
		let rootBS = Math.sqrt(square(bs.x) + square(bs.y) + square(bs.z));
		
		let p5 = Math.sqrt(square(rootCoord) + square(rootBS) - (2 * rootCoord * rootBS * Math.cos(radians(Math.abs(this.PARENT.DECLINATION(this.PARENT_STAR) - this.LATITUDE)))));
		let p4 = 2 * rootCoord * p5;
		let p3 = square(rootCoord) + square(p5) - square(rootBS);
		let p2 = p3 / p4;
		let p1 = Math.acos(p2);
		return degrees(p1) - 90;
	}

	STAR_ALTITUDE() {
		let p1 = radians( Math.abs( this.HOUR_ANGLE() ) );
		return this.STAR_MAX_ALTITUDE() * Math.cos(p1);
	}

	STAR_AZIMUTH() {
		let lat = this.LATITUDE;
		let lon = this.LONGITUDE;
		let sDeclination = this.PARENT.DECLINATION();
		let sLongitude = this.PARENT.ROTATING_MERIDIAN();

		let p4 = Math.sin(radians(sLongitude - lon)) * Math.cos(radians(sDeclination));
		let p3 = Math.cos(radians(lat)) * Math.sin(radians(sDeclination)) - Math.sin(radians(lat)) * Math.cos(radians(sDeclination)) * Math.cos(radians(sLongitude - lon));

		let p2 = Math.atan2(p4, p3);
		let p1 = degrees(p2);
		return modulo(p1 + 360, 360);
	}

	get LENGTH_OF_DAYLIGHT() {
		let p1 = 2 * this.STARRISE_AND_STARSET_ANGLE - this.TERRAIN_RISE - this.TERRAIN_SET;
		return (p1 / this.PARENT.ANGULAR_ROTATION_RATE) * 3 / 4300;
	}

	get LOCAL_TIME() {
		let angle = 360 - (this.HOUR_ANGLE() + 180);
		let percent = angle / 360;
		return 86400 * percent;
	}

	get ILLUMINATION_STATUS() {

		if (this.PARENT.ROTATION_RATE === 0) {
			return (this.STAR_MAX_ALTITUDE() < 0) ? 'Permanent Night' : 'Permanent Day';

		} else if (this.LOCAL_STAR_RISE_TIME.toString() === 'NaN') {
			return (this.STAR_MAX_ALTITUDE() < 0) ? 'Polar Night' : 'Polar Day';

		} else {

			if (this.IS_STAR_RISING_NOW) return 'Starrise';
			if (this.IS_STAR_SETTING_NOW) return 'Starset';

			let rise = this.LOCAL_STAR_RISE_TIME * 86400;
			let set = this.LOCAL_STAR_SET_TIME * 86400;
			let noon = 43200;

			let t = this.LOCAL_TIME;

			if (t > 86400 - 300) {
				return 'Midnight';
			} else if (t > set + 1500) {
				return 'Night';
			} else if (t > set) {
				return 'Evening Twilight';
			} else if (t > set - 7200) {
				return 'Evening';
			} else if (t > noon + 600) {
				return 'Afternoon';
			} else if (t > noon - 600) {
				return 'Noon';
			} else if (t > noon - 3600) {
				return 'Late Morning';
			} else if (t > rise) {
				return 'Morning';
			} else if (t > rise - 1500) {
				return 'Morning Twilight';
			} else if (t > 300) {
				return 'Night';
			} else {
				return 'Midnight';
			}
		}
	}

	get NEXT_NOON() {
		let angle = this.HOUR_ANGLE();
		let rotation = this.PARENT.ANGULAR_ROTATION_RATE;
		let result = (angle > 0) ? angle : (360 + angle);
		return result / rotation / 1440;
	}

	get LOCAL_STAR_RISE_TIME() {
		const percent = 1 - (this.LENGTH_OF_DAYLIGHT / this.PARENT.LENGTH_OF_DAY);
		const half = percent / 2;
		return half;
	}

	get LOCAL_STAR_SET_TIME() {
		const percent = 1 - (this.LENGTH_OF_DAYLIGHT / this.PARENT.LENGTH_OF_DAY);
		const half = percent / 2;
		return 1 - half;
	}

	get NEXT_STAR_RISE() {
		const riseSet = this.STARRISE_AND_STARSET_ANGLE;
		const rotation = this.PARENT.ANGULAR_ROTATION_RATE;

		const partialResult = this.NEXT_NOON - ((riseSet - this.TERRAIN_RISE) / rotation * 3 / 4300);

		if (isNaN(partialResult)) return null;

		if (this.HOUR_ANGLE() > (riseSet - this.TERRAIN_RISE)) {
			return partialResult;

		} else {

			if (this.HOUR_ANGLE() > 0) {
				return partialResult + this.PARENT.LENGTH_OF_DAY;

			} else {
				return partialResult;
			}

		}
	}

	get IS_STAR_RISING_NOW() {
		const padding = 90;

		if (
			this.NEXT_STAR_RISE * 86400 < padding ||
			this.NEXT_STAR_RISE * 86400 > (this.PARENT.LENGTH_OF_DAY * 86400) - padding
		) {
			return true;
		} else {
			return false;
		}
	}

	get NEXT_STAR_SET() {
		const riseSet = this.STARRISE_AND_STARSET_ANGLE;
		const rotation = this.PARENT.ANGULAR_ROTATION_RATE;

		const partialResult = this.NEXT_NOON + ((riseSet - this.TERRAIN_SET) / rotation * 3 / 4300);

		if (isNaN(partialResult)) return null;
		
		if (this.HOUR_ANGLE() > -(riseSet - this.TERRAIN_SET)) {

			if (this.HOUR_ANGLE() > 0) {
				return partialResult;

			} else {
				return partialResult - this.PARENT.LENGTH_OF_DAY;
			}
			
		} else {
			return partialResult;
		}
	}

	get IS_STAR_SETTING_NOW() {
		const padding = 90;

		if (
			this.NEXT_STAR_SET * 86400 < padding ||
			this.NEXT_STAR_SET * 86400 > (this.PARENT.LENGTH_OF_DAY * 86400) - padding
		) {
			return true;
		} else {
			return false;
		}
	}
}