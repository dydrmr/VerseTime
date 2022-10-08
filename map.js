import * as THREE from 'https://cdn.skypack.dev/three@0.134.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DObject } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/renderers/CSS3DRenderer.js';

import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE, POLAR_TO_CARTESIAN, RANDOM } from './HelperFunctions.js';

let scene, camera, renderer, labelRenderer, controls;
let mapDiv = document.getElementById('map-window');

let celestial3DEntity = null;

init();
// createNewScene(window.ACTIVE_LOCATION.PARENT);
render();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

document.addEventListener('keydown', function(event){
	if (event.keyCode === 77) {
		createNewScene(window.ACTIVE_LOCATION.PARENT); 		
	}
});

document.getElementById('BUTTON-toggle-map-window').addEventListener('click', function(e) { 
	createNewScene(window.ACTIVE_LOCATION.PARENT);

	let body = window.ACTIVE_LOCATION.PARENT;

		createNewScene(body);

		// Populate infobox data
		window.setText('map-info-type', body.TYPE);
		window.setText('map-info-system', body.PARENT_STAR.NAME);
		window.setText('map-info-orbits', body.PARENT.NAME);

		// let orbitDist = ROUND(body.ORBITAL_RADIUS / 149598000, 3); // AU
		window.setText('map-info-orbitdistance', ROUND(body.ORBITAL_RADIUS).toLocaleString());

		let radius = body.BODY_RADIUS.toLocaleString();
		window.setText('map-info-radius', radius);

		let circum = body.BODY_RADIUS * Math.PI;
		circum = ROUND(circum, 1);
		window.setText('map-info-circumference', circum.toLocaleString());

		let rot = body.ROTATION_RATE * 3600;
		rot = 360 / rot;
		window.setText('map-info-rotationrate', rot.toLocaleString());

		window.setText('map-info-lengthofday', window.HOURS_TO_TIME_STRING(body.ROTATION_RATE));

		let sats = window.BODIES.filter(bod => {
			if (!bod.PARENT) return false;

			if (bod.PARENT.NAME === body.NAME) {
				return true;
			} else {
				return false;
			}
		});
		window.setText('map-info-naturalsatellites', sats.length);
});

function init() {
	console.debug('THREE.js revision: ' + THREE.REVISION);
	
	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor("#101016");

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	mapDiv.appendChild( labelRenderer.domElement );

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
	camera.position.set(0, 20, 0);
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, labelRenderer.domElement);
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.03;
	controls.rotateSpeed = 0.5;
	controls.maxPolarAngle = Math.PI * 0.95;
	controls.minPolarAngle = Math.PI * 0.05;
	controls.smoothZoom = true;
	controls.zoomDampingFactor = 0.2;
	controls.smoothZoomSpeed = 5.0;
	controls.maxDistance = 10;
	controls.minDistance = 1.5;

	mapDiv.appendChild( renderer.domElement );
}

function render() {
	controls.update();
	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
	requestAnimationFrame(render);


	if (!showMapWindow) return;


	// Check if location is occluded
	// Improve performance on slower devices by doing it every 5th frame
	if (renderer.info.render.frame % 5 === 0) {
		let raycaster = new THREE.Raycaster();
		let v = new THREE.Vector3();
		let r = window.ACTIVE_LOCATION.PARENT.BODY_RADIUS;
		let bodyMesh = scene.getObjectByName('Celestial Object');

		let locationLabels = document.querySelectorAll('.mapLocationNameLabel');
		locationLabels.forEach(label => {

			let location = window.LOCATIONS.filter(loc => loc.NAME === label.innerText)[0];
			
			let posRaw = location.COORDINATES;
			let x = -posRaw.x / r; // adjust for rotation direction
			let y = posRaw.y / r;
			let z = posRaw.z / r;
			let pos = new THREE.Vector3(x, z, y); // Y = UP in THREE.JS, so switch Z and Y

			v.copy(pos).sub(camera.position).normalize().multiply(new THREE.Vector3(-1, -1, -1));
			raycaster.set( pos, v );
			let intersects = raycaster.intersectObject(bodyMesh, true);

			let occluded = intersects.length > 0
			label.style.opacity = occluded ? '0.075' : '0.8';
			label.style.fontWeight = occluded ? 'normal' : '600';
			label.nextSibling.dataset.occluded = occluded ? 'true' : 'false';		
		});
	}


	// Update map marker time
	let timeLabels = document.querySelectorAll('.mapLocationTimeLabel');
	timeLabels.forEach(label => {
		let locName = label.dataset.location;
		let location = window.LOCATIONS.filter(loc => loc.NAME === locName)[0];

		let s = location.ILLUMINATION_STATUS;
		if (s === 'Night' || s === 'Midnight' || s === 'Morning Twilight' || s === 'Evening Twilight' || s === 'Perma-Night') {
			label.classList.add('blue');
			label.classList.remove('yellow');
		} else {
			label.classList.remove('blue');
			label.classList.add('yellow');
		}

		let string = window.HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false);
		if (string === 'NaN:NaN') string = location.ILLUMINATION_STATUS;
		
		window.setText(label, string);

		label.style.opacity = (label.dataset.occluded === 'true') ? '0' : '0.8';
	});
}



function createTestScene() {
	let geo = new THREE.SphereGeometry(10, 20, 20);
	let mat = new THREE.MeshBasicMaterial({color: 0xffffff});
	let s = new THREE.Mesh(geo, mat);
	s.position.set(0, 0, 0);
	scene.add(s);
}



function createNewScene(celestialObject) {
	let r = celestialObject.BODY_RADIUS;
	let c = celestialObject.THEME_COLOR;
	let locations = window.LOCATIONS.filter(loc => loc.PARENT === celestialObject);

	document.getElementById('map-body-name').textContent = celestialObject.NAME;

	scene.clear();

	let oldLabels1 = document.querySelectorAll('.mapLocationNameLabel');
	let oldLabels2 = document.querySelectorAll('.mapLocationTimeLabel');
	oldLabels1.forEach(label => {label.remove()});
	oldLabels2.forEach(label => {label.remove()});

	camera.position.set(2, 0.5, 2);

	createStarfield();

	// CELESTIAL BODY
	createLatLonGrid(scene, c, 0.995);
	createTexturedSphere(celestialObject, 0.9975);
	createDaySphere(celestialObject, 0.9975);

	// LOCATIONS
	let vertices = [];

	for (let i = 0; i < locations.length; i++) {
		let pos = locations[i].COORDINATES;
		let x = -pos.x / r; // adjust for rotation direction
		let y = pos.y / r;
		let z = pos.z / r;
		vertices.push(x, z, y); // Y = UP in THREE.JS, so switch Z and Y

		// TEXT LABELS
		let labelDiv = document.createElement('div');
		labelDiv.className = 'mapLocationNameLabel';
		labelDiv.textContent = locations[i].NAME;
		
		let nameLabel = new CSS2DObject(labelDiv);
		let nameLabelPosition = new THREE.Vector3(x, z, y);
		nameLabel.position.copy(nameLabelPosition);
		
		scene.add(nameLabel);

		let timeDiv = document.createElement('div');
		timeDiv.className = 'mapLocationTimeLabel';
		timeDiv.textContent = window.HOURS_TO_TIME_STRING(locations[i].LOCAL_TIME / 60 / 60, false);
		timeDiv.dataset.location = locations[i].NAME;
		timeDiv.dataset.occluded = 'false';

		let timeLabel = new CSS2DObject(timeDiv);
		timeLabel.position.copy(nameLabelPosition);

		scene.add(timeLabel);
	}

	let geoLocs = new THREE.BufferGeometry();
	geoLocs.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	
	let matLocs = new THREE.PointsMaterial({
		color: `rgb(${c.r}, ${c.g}, ${c.b})`,
		size: 4,
		sizeAttenuation: false
	});

	let mesh = new THREE.Points(geoLocs, matLocs);
	scene.add(mesh);
}

function makeLine(x1, y1, z1, x2, y2, z2, mat) {
	const p = [];
	p.push(new THREE.Vector3(x1, y1, z1));
	p.push(new THREE.Vector3(x2, y2, z2));
	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const line = new THREE.Line(geo, mat);
	return line;
}

function createLatLonGrid(scene, color, scale = 0.99) {
	const material = new THREE.LineBasicMaterial( {
		color: `rgb(${color.r}, ${color.g}, ${color.b})`,
		transparent: true,
		opacity: 0.1
	});

	for (let i = 0; i < 180; i += 30) {
		scene.add(makeLongitudeCircle(i, material, scale));
	}

	for (let i = 15; i < 180; i += 15) {
		scene.add(makeLatitudeCircle(i, material, scale));
	}
}

function makeLongitudeCircle(angle, material, scale) {
	const p = [];
	for (let i = 0; i <= 360; i += 360 / 96) {
		let rad = RADIANS(i);
		let x = 0;
		let y = Math.sin(rad) * scale;
		let z = Math.cos(rad) * scale;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	circle.rotation.y = RADIANS(angle);
	return circle;
}

function makeLatitudeCircle(angle, material, scale) {
	const p = [];

	for (let i = 0; i <= 360; i += 360 / 96) {
		let rad = RADIANS(i);
		let x = Math.cos(rad) * Math.sin(RADIANS(angle)) * scale;
		let y = Math.cos(RADIANS(angle)) * scale;
		let z = Math.sin(rad) * Math.sin(RADIANS(angle)) * scale;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	return circle;
}


function createDaySphere(celestialObject, scale = 1) {
	let c = celestialObject.THEME_COLOR;
	let geo = new THREE.SphereGeometry(scale, 48, 48);
	let mat = new THREE.MeshBasicMaterial({
		color: `rgb(${c.r}, ${c.g}, ${c.b})`,
		transparent: true,
		opacity: 0.15,
		depthWrite: false
	});

	let obj = new THREE.Mesh(geo, mat);
	obj.name = 'Celestial Object';
	scene.add(obj);
}

function createNightSphere(celestialObject) {
	// TESTING ONLY
	let c = celestialObject.THEME_COLOR;
	let geo = new THREE.SphereGeometry(1, 48, 48, 0, Math.PI);
	let mat = new THREE.MeshBasicMaterial({
		color: `rgb(20, 20, 20)`,
		transparent: true,
		opacity: 0.3
	});

	let obj = new THREE.Mesh(geo, mat);
	obj.rotation.y = RADIANS(celestialObject.MERIDIAN() + celestialObject.ROTATION_CORRECTION + 180);
	scene.add(obj);
}

function createTexturedSphere(celestialObject, scale = 1) {
	var loader = new THREE.TextureLoader();
	let file = 'static/assets/' + celestialObject.NAME.toLowerCase() + '.webp';
	loader.load(file, function ( texture ) {

		let geo = new THREE.SphereGeometry(scale, 48, 48, 0, Math.PI * 2);
		let mat = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: 0.2
		});

		let obj = new THREE.Mesh(geo, mat);
		obj.name = 'Celestial Object';
		scene.add(obj);
	} );
}

function createStarfield(amount = 250) {
	let vertices = [];

	for (let i = 0; i < amount; i++) {
		let theta = RANDOM() * 2.0 * Math.PI;
		let phi = Math.acos(2.0 * RANDOM() - 1.0);
		let r = Math.cbrt(RANDOM()) * 1500;
		let c = POLAR_TO_CARTESIAN(DEGREES(theta), DEGREES(phi), r);
		vertices.push(c.x, c.z, c.y);
	}

	let stars = new THREE.BufferGeometry();
	stars.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

	let mat = new THREE.PointsMaterial({
		color: `rgb(255, 255, 255)`,
		size: 0.02,
		sizeAttenuation: true,
		transparent: true,
		opacity: 0.6
	});

	let mesh = new THREE.Points(stars, mat);
	scene.add(mesh);
}

function createCelestialMarkers() {
	// for testing only right now
	const matRed = new THREE.LineBasicMaterial( {
		color: `rgb(255, 0, 0)`,
		transparent: true,
		opacity: 0.5
	});
	scene.add(makeLine(-3, 0, 0, 3, 0, 0, matRed));

	const matStarDirection = new THREE.LineBasicMaterial( {
		color: `rgb(255, 255, 0)`,
		transparent: true,
		opacity: 0.4
	});

	let m = RADIANS(celestialObject.MERIDIAN() - celestialObject.ROTATION_CORRECTION);
	let starDirection = makeLine(0, 0, 0, Math.cos(m)*2, 0, Math.sin(m)*2, matStarDirection);
	scene.add(starDirection);
}