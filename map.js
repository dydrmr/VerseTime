import * as THREE from 'https://cdn.skypack.dev/three@0.134.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/renderers/CSS2DRenderer.js';

import { DEGREES, RADIANS, MODULO, SQUARE, ROUND, JULIAN_DATE } from './HelperFunctions.js';

let scene, camera, renderer, labelRenderer, controls;
let mapDiv = document.getElementById('map-window');

init();
createNewScene(window.ACTIVE_LOCATION.PARENT);
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

document.getElementById('BUTTON-toggle-map-window').addEventListener('click', function(e) { createNewScene(window.ACTIVE_LOCATION.PARENT); });

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

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

	let timeLabels = document.querySelectorAll('.mapLocationTimeLabel');
	timeLabels.forEach(label => {
		let locName = label.dataset.location;
		let location = window.LOCATIONS.filter(loc => loc.NAME === locName)[0];

		let string = window.HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false);
		window.setText(label, string)
		// label.textContent = window.HOURS_TO_TIME_STRING(location.LOCAL_TIME / 60 / 60, false);
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


	// LONGITUDE/LATITUDE LINES
	const matLongi = new THREE.LineBasicMaterial( {
		color: `rgb(${c.r}, ${c.g}, ${c.b})`,
		transparent: true,
		opacity: 0.05
	});

	for (let i = 0; i < 360; i += 30) {
		scene.add(makeLongitudeCircle(i, matLongi));
	}

	for (let i = 0; i < 180; i += 15) {
		scene.add(makeLatitudeCircle(i, matLongi));
	}


	// CELESTIAL BODY
	createDaySphere(celestialObject);
	createNightSphere(celestialObject);

	// LOCATIONS
	let vertices = [];

	for (let i = 0; i < locations.length; i++) {
		let pos = locations[i].COORDINATES;
		let x = -pos.x / r; // adjust for rotation direction
		let y = pos.y / r;
		let z = pos.z / r;
		// Y = UP in THREE.JS, so switch Z and Y:
		vertices.push(x, z, y);


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

		let timeLabel = new CSS2DObject(timeDiv);
		timeLabel.position.copy(nameLabelPosition);

		scene.add(timeLabel);

	}

	let geoLocs = new THREE.BufferGeometry()
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

function makeLongitudeCircle(angle, material) {
	const p = [];
	for (let i = 0; i <= 360; i += 360 / 96) {
		let rad = RADIANS(i);
		let mult = 0.997;
		let x = 0;
		let y = Math.sin(rad) * mult;
		let z = Math.cos(rad) * mult;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	circle.rotation.y = RADIANS(angle);
	return circle;
}

function makeLatitudeCircle(angle, material) {
	const p = [];

	for (let i = 0; i <= 360; i += 360 / 96) {
		let rad = RADIANS(i);
		let mult = 0.997;
		let x = Math.cos(rad) * Math.sin(RADIANS(angle)) * mult;
		let y = Math.cos(RADIANS(angle)) * mult;
		let z = Math.sin(rad) * Math.sin(RADIANS(angle)) * mult;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	return circle;
}


function createDaySphere(celestialObject) {
	let c = celestialObject.THEME_COLOR;
	let geo = new THREE.SphereGeometry(1, 48, 48);
	let mat = new THREE.MeshBasicMaterial({
		color: `rgb(${c.r}, ${c.g}, ${c.b})`,
		transparent: true,
		opacity: 0.15
	});

	let obj = new THREE.Mesh(geo, mat);
	scene.add(obj);
}

function createNightSphere(celestialObject) {
	return;

	// testing for now
	let c = celestialObject.THEME_COLOR;
	let geo = new THREE.SphereGeometry(1.001, 48, 48, 0, Math.PI);
	let mat = new THREE.MeshBasicMaterial({
		color: `rgb(20, 20, 20)`,
		transparent: true,
		opacity: 0.3
	});

	let obj = new THREE.Mesh(geo, mat);
	obj.rotation.y = RADIANS(celestialObject.MERIDIAN() + celestialObject.ROTATION_CORRECTION + 180);
	scene.add(obj);
}