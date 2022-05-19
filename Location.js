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

// CALCULATED
let LATITUDE = null;
let LONGITUDE = null;
let LONGITUDE_360 = null;
let ELEVATION = null;
let ELEVATION_IN_DEGREES = null;
let STARRISE_AND_STARSET_ANGLE = null;

export default class Location {
	constructor(name, type, parentBody, parentStar, coordinates, themeColor = null, themeImage = null) {
		this.NAME = name;
		this.TYPE = type;
		this.PARENT = parentBody;
		this.PARENT_STAR = parentStar;
		this.COORDINATES = coordinates;
		this.THEME_COLOR = themeColor ? themeColor : this.PARENT.THEME_COLOR;
		this.THEME_IMAGE = (themeImage === '' || themeImage === null) ? this.PARENT.THEME_IMAGE : themeImage;

		// CALCULATED PROPERTIES
		// LATITUDE
		let lat2 = Math.sqrt( SQUARE(this.COORDINATES.x) + SQUARE(this.COORDINATES.y) );
		let lat1 = Math.atan2( this.COORDINATES.z, lat2 );
		this.LATITUDE = DEGREES(lat1);

		// LONGITUDE
		if (Math.abs(latitude) === 90) { 
			this.LONGITUDE = 0;
		
		} else {
			let condition = DEGREES( MODULO( Math.atan2(this.COORDINATES.y, this.COORDINATES.x) - (Math.PI / 2), 2 * Math.PI ) );

			if( condition > 180 ) {
				this.LONGITUDE = -( 360 - condition );
			} else {
				this.LONGITUDE = condition;
			}
		}

		// LONGITUDE 360
		if (Math.abs(this.LATITUDE) === 90) {
			this.LONGITUDE_360 = 0;

		} else {
			let distX = this.COORDINATES.x;
			let distY = this.COORDINATES.y;

			let p3 = Math.atan2(distY, distX);
			let p2 = p3 - (Math.PI / 2);
			let p1 = MODULO(p2, 2 * Math.PI);
			this.LONGITUDE_360 = DEGREES(p1);

		}

		// ELEVATION
		this.ELEVATION = Math.sqrt(SQUARE(this.COORDINATES.x) + SQUARE(this.COORDINATES.y) + SQUARE(this.COORDINATES.z)) - this.PARENT.BODY_RADIUS;

		// ELEVATION IN DEGREES
		let radius = this.PARENT.BODY_RADIUS;
		let height = this.ELEVATION;
		let p3 = height < 0 ? 0 : height;
		let p2 = radius + p3;
		let p1 = Math.acos( radius / p2 );
		this.ELEVATION_IN_DEGREES = DEGREES(p1);

		// STAR RISE/SET ANGLE
		let p4 = Math.tan( RADIANS(this.PARENT.DECLINATION(this.PARENT_STAR)) );
		p3 = Math.tan( RADIANS(this.LATITUDE) );
		p2 = -p3 * p4;
		p1 = Math.acos(p2); 
		this.STARRISE_AND_STARSET_ANGLE = DEGREES(p1) + this.PARENT.APPARENT_RADIUS(this.PARENT_STAR) + this.ELEVATION_IN_DEGREES;


		// FINALIZATION
		window.LOCATIONS.push(this);
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

	get LENGTH_OF_DAYLIGHT() {
		let terrainRise = 0; // NOT IMPLEMENTED
		let terrainSet = 0;  // NOT IMPLEMENTED

		let p1 = 2 * this.STARRISE_AND_STARSET_ANGLE - terrainRise - terrainSet;
		return (p1 / this.PARENT.ANGULAR_ROTATION_RATE) * 3 / 4300;
	}

	get LOCAL_TIME() {
		let angle = 360 - (this.HOUR_ANGLE() + 180);
		let percent = angle / 360;
		return 86400 * percent;
	}

	get ILLUMINATION_STATUS() {
		if (this.LOCAL_STAR_RISE_TIME.toString() === 'NaN') {
			return (this.STAR_MAX_ALTITUDE() < 0) ? 'Perma-night' : 'Perma-day';

		} else {
			let t = this.LOCAL_TIME;
			if (t > 86400 - 300) {
				return 'Midnight';
			} else if (t > this.LOCAL_STAR_SET_TIME * 86400 + 1500) {
				return 'Night';
			} else if (t > this.LOCAL_STAR_SET_TIME * 86400 + 60) {
				return 'Evening Twilight';
			} else if (t > this.LOCAL_STAR_SET_TIME * 86400 - 1200) {
				return 'Starset';
			} else if (t > this.LOCAL_STAR_SET_TIME * 86400 - 3600) {
				return 'Late Afternoon';
			} else if (t > 43200 + 600) {
				return 'Afternoon';
			} else if (t > 43200 - 600) {
				return 'Noon';
			} else if (t > 43200 - 3600) {
				return 'Late Morning';
			} else if (t > this.LOCAL_STAR_RISE_TIME * 86400 + 1200) {
				return 'Morning';
			} else if (t > this.LOCAL_STAR_RISE_TIME * 86400 - 60) {
				return 'Starrise';
			} else if (t > this.LOCAL_STAR_RISE_TIME * 86400 - 1500) {
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
		let percent = 1 - (this.LENGTH_OF_DAYLIGHT / this.PARENT.LENGTH_OF_DAY());
		let half = percent / 2;
		return half;
	}

	get LOCAL_STAR_SET_TIME() {
		let percent = 1 - (this.LENGTH_OF_DAYLIGHT / this.PARENT.LENGTH_OF_DAY());
		let half = percent / 2;
		return 1 - half;
	}

	get NEXT_STAR_RISE() {
		let riseSet = this.STARRISE_AND_STARSET_ANGLE;
		let rotation = this.PARENT.ANGULAR_ROTATION_RATE;
		let terrainRise = 0; // NOT IMPLEMENTED

		let partialResult = this.NEXT_NOON - ((riseSet - terrainRise) / rotation * 3 / 4300);

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
		let riseSet = this.STARRISE_AND_STARSET_ANGLE;
		let rotation = this.PARENT.ANGULAR_ROTATION_RATE;
		let terrainSet = 0; // NOT IMPLEMENTED

		let partialResult = this.NEXT_NOON + ((riseSet - terrainSet) / rotation * 3 / 4300);

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