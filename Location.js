import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE } from './HelperFunctions.js';

let NAME = '[name not defined]';
let TYPE = '[type not defined]';
let PARENT = null;
let PARENT_STAR = null;
let COORDINATES = {
	'x' : null,
	'y' : null,
	'z' : null
};

let THEME_COLOR = {
	'r' : null,
	'g' : null,
	'b' : null
};
let THEME_IMAGE = null;

export default class Location {
	constructor(name, type, parentBody, parentStar, coordinates, themeColor = null, themeImage) {
		this.NAME = name;
		this.TYPE = type;
		this.PARENT = parentBody;
		this.PARENT_STAR = parentStar;
		this.COORDINATES = coordinates;
		this.THEME_COLOR = themeColor ? themeColor : this.PARENT.THEME_COLOR;
		this.THEME_IMAGE = themeImage;
	}

	get LATITUDE() {
		let lat2 = Math.sqrt( SQUARE(this.COORDINATES.x) + SQUARE(this.COORDINATES.y) );
		let lat1 = Math.atan2( this.COORDINATES.z, lat2 );
		return DEGREES( lat1 );
	}

	get LONGITUDE() {
		let longitude = undefined;
		if (Math.abs(latitude) === 90) { 
			longitude = 0;
		
		} else {

			let condition = DEGREES( MODULO( Math.atan2(this.COORDINATES.y, this.COORDINATES.x) - (Math.PI / 2), 2 * Math.PI ) );

			if( condition > 180 ) {
				longitude = -( 360 - condition );
			} else {
				longitude = condition;
			}

		}

		return longitude;
	}

	get LONGITUDE_360() {
		let result = null;

		if (Math.abs(this.LATITUDE) === 90) {
			result = 0;

		} else {
			let distX = this.COORDINATES.x;
			let distY = this.COORDINATES.y;

			let p3 = Math.atan2(distY, distX);
			let p2 = p3 - (Math.PI / 2);
			let p1 = MODULO(p2, 2 * Math.PI);
			result = DEGREES(p1);

		}

		return result;
	}

	ELEVATION() {
		let kilometers = Math.sqrt(SQUARE(this.COORDINATES.x) + SQUARE(this.COORDINATES.y) + SQUARE(this.COORDINATES.z)) - this.PARENT.BODY_RADIUS;
		return kilometers;
	}

	ELEVATION_IN_DEGREES() {
		let radius = this.PARENT.BODY_RADIUS;
		let height = this.ELEVATION();

		let p3 = height < 0 ? 0 : height;
		let p2 = radius + p3;
		let p1 = Math.acos( radius / p2 );

		return DEGREES(p1);
	}

	STARRISE_AND_STARSET_ANGLE() {
		let latitude = this.LATITUDE;

		let p4 = Math.tan( RADIANS(this.PARENT.DECLINATION(this.PARENT_STAR)) );
		let p3 = Math.tan( RADIANS(latitude) );
		let p2 = -p3 * p4;
		let p1 = Math.acos(p2); 

		return DEGREES(p1) + this.PARENT.APPARENT_RADIUS(this.PARENT_STAR) + this.ELEVATION_IN_DEGREES();
	}

	HOUR_ANGLE() {
		let cycleHourAngle = this.PARENT.HOUR_ANGLE();
		let longitude360 = this.LONGITUDE_360;
		let sMeridian = this.PARENT.MERIDIAN();

		let result = MODULO(cycleHourAngle - MODULO(longitude360 - sMeridian, 360), 360);
		return (result > 180) ? result - 360 : result;
	}

	STAR_MAX_ALTITUDE() {
		let coords = this.COORDINATES;
		let bs = this.PARENT.BS(this.PARENT_STAR);

		let rootCoord = Math.sqrt(SQUARE(coords.x) + SQUARE(coords.y) + SQUARE(coords.z));
		let rootBS = Math.sqrt(SQUARE(bs.x) + SQUARE(bs.y) + SQUARE(bs.z));
		
		let p5 = Math.sqrt(SQUARE(rootCoord) + SQUARE(rootBS) - (2 * rootCoord * rootBS * Math.cos(RADIANS(Math.abs(this.PARENT.DECLINATION(this.PARENT_STAR) - this.LATITUDE)))));
		let p4 = 2 * rootCoord * p5;
		let p3 = SQUARE(rootCoord) + SQUARE(p5) - SQUARE(rootBS);
		let p2 = p3 / p4;
		let p1 = Math.acos(p2);
		return DEGREES(p1) - 90;
	}

	STAR_ALTITUDE() {
		let p1 = RADIANS( Math.abs( this.HOUR_ANGLE() ) );
		return this.STAR_MAX_ALTITUDE() * Math.cos(p1);
	}

	STAR_AZIMUTH() {
		let lat = this.LATITUDE;
		let lon = this.LONGITUDE;
		let sDeclination = this.PARENT.DECLINATION();
		let sLongitude = this.PARENT.LONGITUDE();

		let p4 = Math.sin(RADIANS(sLongitude - lon)) * Math.cos(RADIANS(sDeclination));
		let p3 = Math.cos(RADIANS(lat)) * Math.sin(RADIANS(sDeclination)) - Math.sin(RADIANS(lat)) * Math.cos(RADIANS(sDeclination)) * Math.cos(RADIANS(sLongitude - lon));

		let p2 = Math.atan2(p4, p3);
		let p1 = DEGREES(p2);
		return MODULO(p1 + 360, 360);
	}

	get LOCAL_TIME() {
		let angle = 360 - (this.HOUR_ANGLE() + 180);
		let percent = angle / 360;
		return 86400 * percent;
	}

	get NEXT_NOON() {
		let angle = this.HOUR_ANGLE();
		let angularRotationRate = 6 / this.PARENT.ROTATION_RATE;
		let result = angle > 0 ? angle / angularRotationRate : (360 + angle) / angularRotationRate;
		return result / 1440;
	}

	get NEXT_STAR_RISE() {
		let riseSet = this.STARRISE_AND_STARSET_ANGLE();
		let angularRotationRate = 6 / this.PARENT.ROTATION_RATE;
		let terrainRise = 0; // VARIABLE NOT BUILT INTO THE LOCATION CLASS

		let partialResult = this.NEXT_NOON - ((riseSet - terrainRise) / angularRotationRate * 3 / 4300);

		if (this.HOUR_ANGLE() > (riseSet - terrainRise)) {
			return partialResult;

		} else {

			if (this.HOUR_ANGLE() > 0) {
				return partialResult + this.PARENT.LENGTH_OF_DAY();

			} else {
				return partialResult;
			}

		}
	}

	get NEXT_STAR_SET() {
		let angularRotationRate = 6 / this.PARENT.ROTATION_RATE;
		let riseSet = this.STARRISE_AND_STARSET_ANGLE();
		let terrainSet = 0; // VARIABLE NOT BUILT INTO THE LOCATION CLASS

		let partialResult = this.NEXT_NOON + ((riseSet - terrainSet) / angularRotationRate * 3 / 4300);

		if (this.HOUR_ANGLE() > -(riseSet - terrainSet)) {

			if (this.HOUR_ANGLE() > 0) {
				return partialResult;

			} else {
				return partialResult - this.PARENT.LENGTH_OF_DAY();
			}
			
		} else {
			return partialResult;
		}
	}
}