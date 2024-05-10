import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { TrackballControls }  from 'three/addons/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';

import { degrees, radians, round, convertPolarToCartesian, random, convertHoursToTimeString } from './HelperFunctions.js';
import Settings from './classes/app/Preferences.js';
import DB from './classes/app/Database.js';
import UI from './classes/app/UserInterface.js';

let scene, camera, renderer, labelRenderer, controls, zoomControls;
let mapDiv = UI.el('map-window');
let bodyMesh = null;

const circleDetail = 72;
const omDistance = Math.sqrt(2);
const orbitalMarkerCoordinates = [
	{ x:  0, y:  0,  z:  omDistance },
	{ x:  0, y:  0,  z: -omDistance },
	{ x:  0, y:  omDistance,  z:  0 },
	{ x:  0, y: -omDistance,  z:  0 },
	{ x: -omDistance, y:  0,  z:  0 },
	{ x:  omDistance, y:  0,  z:  0 },
];

setup();
render();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

document.addEventListener('createMapScene', setupMapScene);
document.addEventListener('redrawMapTexture', redrawMapTexture);
document.addEventListener('moveMapCameraAboveActiveLocation', setCameraAboveActiveLocation);

function setupMapScene() {
	const body = Settings.activeLocation.PARENT;
	createNewScene(body);
	bodyMesh = scene.getObjectByName('Textured Sphere') ?? scene.getObjectByName('Solid Sphere');
	setupInfoboxData();
}

function setupInfoboxData() {
	const body = Settings.activeLocation.PARENT;

	UI.setText('map-info-type', body.TYPE);
	UI.setText('map-info-system', body.PARENT_STAR.NAME);
	UI.setText('map-info-orbits', body.PARENT.NAME);
	UI.setText('map-info-orbitdistance', round(body.ORBITAL_RADIUS).toLocaleString());
	UI.setText('map-info-radius', body.BODY_RADIUS.toLocaleString());
	
	const circum = round(body.BODY_RADIUS * Math.PI, 1);
	UI.setText('map-info-circumference', circum.toLocaleString());

	const rotation = 360 / (body.ROTATION_RATE * 3600);

	const rotationRateString = (rotation === Infinity) ? 'Tidally locked' : rotation.toLocaleString() + '° / sec';
	UI.setText('map-info-rotationrate', rotationRateString);

	const dayLengthString = (rotation === Infinity) ? '---' : convertHoursToTimeString(body.ROTATION_RATE);
	UI.setText('map-info-lengthofday', dayLengthString);

	UI.setText('map-info-naturalsatellites', body.NATURAL_SATELLITES.length);
}

function setup() {
	// console.debug('THREE.js revision: ' + THREE.REVISION);
	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('#101016');

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	mapDiv.appendChild( labelRenderer.domElement );

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3000);
	camera.position.set(0, 20, 0);
	camera.lookAt(0, 0, 0);

	controls = new OrbitControls(camera, labelRenderer.domElement);
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.rotateSpeed = 0.5;
	controls.maxPolarAngle = Math.PI * 0.95;
	controls.minPolarAngle = Math.PI * 0.05;
	controls.enableZoom = false;

	zoomControls = new TrackballControls(camera, labelRenderer.domElement);
	zoomControls.noRotate = true;
	zoomControls.noPan = true;
	zoomControls.noZoom = false;
	zoomControls.zoomSpeed = 0.5;
	zoomControls.maxDistance = 5;
	zoomControls.minDistance = 1.15;
	zoomControls.zoomDampingFactor = 0.2;
	zoomControls.smoothZoomSpeed = 5.0;

	mapDiv.appendChild( renderer.domElement );
}

function render() {
	const target = controls.target;
	controls.update();
	zoomControls.target.set(target.x, target.y, target.z);
	zoomControls.update();

	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
	requestAnimationFrame(render);

	if (!UI.Map.show) return;

	updateLabelOcclusion();
	updateLocationLabelTimes();
	updatePlanetShadow();
}

function updateLabelOcclusion() {
	if (renderer.info.render.frame % 10 !== 0) { return; }
	
	const raycaster = new THREE.Raycaster();
	const v = new THREE.Vector3();
	const r = Settings.activeLocation.PARENT.BODY_RADIUS;
	
	//LOCATION LABELS
	let locationLabels = document.querySelectorAll('.mapLocationLabel');
	locationLabels.forEach(label => {
		const location = DB.locations.filter(loc => loc.NAME === label.dataset.location)[0];

		const coord = location.COORDINATES_3DMAP;
		const pos = new THREE.Vector3(coord.x, coord.z, coord.y); // Y = UP

		v.copy(pos).sub(camera.position).normalize().multiply(new THREE.Vector3(-1, -1, -1));
		raycaster.set(pos, v);
		const intersects = raycaster.intersectObject(bodyMesh, false);
		label.dataset.occluded = (intersects.length > 0) ? true : false;
	});

	// ORBITAL MARKERS
	if (!document.getElementById('map-settings-show-orbitalmarkers').checked) { return; }

	let orbitalMarkerLabels = document.querySelectorAll('.mapOrbitalMarker');
	orbitalMarkerLabels.forEach(label => {
		const markerNumber = label.innerText.replace('OM', '');
		const coord = orbitalMarkerCoordinates[markerNumber - 1];
		const pos = new THREE.Vector3(coord.x, coord.z, coord.y); // Y = UP

		v.copy(pos).sub(camera.position).normalize().multiply(new THREE.Vector3(-1, -1, -1));
		raycaster.set( pos, v );
		const intersects = raycaster.intersectObject(bodyMesh, true);
		label.dataset.occluded = intersects.length > 0 ? true : false;
	});
}

function updateLocationLabelTimes() {
	const unchanging = ['Polar Day', 'Polar Night', 'Permanent Day', 'Permanent Night'];
	const nightStatus = ['Night', 'Midnight', 'Morning Twilight', 'Evening Twilight', 'Polar Night', 'Starset'];

	let timeLabels = document.querySelectorAll('.mapLocationTime');
	for (let label of timeLabels) {
		const location = DB.locations.filter(loc => loc.NAME === label.parentNode.dataset.location)[0];

		if (nightStatus.includes(location.ILLUMINATION_STATUS)) {
			setLocationLabelColor(label, 'night');
		} else {
			setLocationLabelColor(label, 'day');
		}

		let string = convertHoursToTimeString(location.LOCAL_TIME / 60 / 60, false);
		if (unchanging.includes(location.ILLUMINATION_STATUS)) {
			string = location.ILLUMINATION_STATUS;
		}
		
		UI.setText(label, string);
	}
}

function setLocationLabelColor(label, phase) {
	if (phase === 'day') {
		label.classList.remove('blue');
		label.classList.add('yellow');
	} else {
		label.classList.remove('yellow');
		label.classList.add('blue');
	}
}

function updatePlanetShadow() {
	const terminator = scene.getObjectByName('Terminator');
	const terminatorAngle = Settings.activeLocation.PARENT.ROTATING_MERIDIAN(Settings.activeLocation.PARENT_STAR);
	terminator.rotation.y = radians(terminatorAngle);
	terminator.visible = document.getElementById('map-settings-show-terminator').checked;
}





function createNewScene(celestialObject) {
	scene.clear();

	document.getElementById('map-body-name').textContent = celestialObject.NAME;

	const mapWindow = UI.el('map-window');
	const oldLabels = mapWindow.querySelectorAll( '.mapLocationLabel, .mapLocationName, .mapLocationTime, .mapLocationIcon, .mapOrbitalMarker' );
	oldLabels.forEach(l => {l.remove()});

	createStarfield();

	const c = celestialObject.THEME_COLOR;
	createOcclusionSphere(c, 0.997);
	createLatLonGrid(scene, c, 0.998);
	createTexturedSphere(celestialObject, 0.9995);
	createShadow(celestialObject, 1);
	createRing(celestialObject);

	createLocationLabels(celestialObject);
	createOrbitalMarkerLabels();

	setCameraAboveActiveLocation();
}



function createLatLonGrid(scene, color, scale = 1) {
	let r = parseInt(color.r / 3);
	let g = parseInt(color.g / 3);
	let b = parseInt(color.b / 3);

	const material = new THREE.LineBasicMaterial( {
		color: `rgb(${r}, ${g}, ${b})`,
		transparent: false,
		opacity: 0.15
	});

	let grid = new THREE.Group();
	grid.name = 'Grid';

	for (let i = 0; i < 180; i += 30) {
		let circle = makeLongitudeCircle(i, material, scale);
		grid.add(circle);
	}

	for (let i = 15; i < 180; i += 15) {
		let circle = makeLatitudeCircle(i, material, scale);
		grid.add(circle);
	}

	scene.add(grid);
	grid.visible = document.getElementById('map-settings-show-grid').checked;
}

function makeLongitudeCircle(angle, material, scale) {
	const p = [];
	for (let i = 0; i <= 360; i += 360 / circleDetail) {
		let rad = radians(i);
		let x = 0;
		let y = Math.sin(rad) * scale;
		let z = Math.cos(rad) * scale;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	circle.rotation.y = radians(angle);
	return circle;
}

function makeLatitudeCircle(angle, material, scale) {
	const p = [];
	for (let i = 0; i <= 360; i += 360 / circleDetail) {
		let rad = radians(i);
		let x = Math.cos(rad) * Math.sin(radians(angle)) * scale;
		let y = Math.cos(radians(angle)) * scale;
		let z = Math.sin(rad) * Math.sin(radians(angle)) * scale;
		p.push(new THREE.Vector3(x, y, z));
	}

	const geo = new THREE.BufferGeometry().setFromPoints(p);
	const circle = new THREE.Line(geo, material);
	return circle;
}

function createTexturedSphere(celestialObject, scale = 1) {
	const textureOpacity = document.getElementById('map-settings-planet-transparency').value / 100;

	var loader = new THREE.TextureLoader();
	const file = Settings.getCelestialBodyTexturePath(Settings.activeLocation.PARENT);

	loader.load(file, function ( texture ) {
		texture.colorSpace = THREE.SRGBColorSpace;

		let geo = new THREE.SphereGeometry(scale, circleDetail, circleDetail, 0, Math.PI * 2);
		let mat = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: textureOpacity
		});

		let obj = new THREE.Mesh(geo, mat);
		obj.name = 'Textured Sphere';
		scene.add(obj);
	} );
}

function createOcclusionSphere(color, scale = 1) {
	let blackGeo = new THREE.SphereGeometry(scale, circleDetail, circleDetail, 0, Math.PI * 2);
	let blackMat = new THREE.MeshBasicMaterial({
		color: `rgb(${parseInt(color.r /5)}, ${parseInt(color.g /5)}, ${parseInt(color.b /5)})`,
		transparent: false,
	});
	let blackObj = new THREE.Mesh(blackGeo, blackMat);
	blackObj.name = 'Solid Sphere';
	scene.add(blackObj);
}

function createShadow(celestialObject, scale) {
	let textureOpacity = document.getElementById('map-settings-planet-transparency').value / 100;
	textureOpacity = THREE.MathUtils.mapLinear(textureOpacity, 0, 1, 0.15, 0.5);

	const angle = celestialObject.ROTATING_MERIDIAN(celestialObject.PARENT_STAR);
	const declination = celestialObject.DECLINATION(celestialObject.PARENT_STAR);

	let group = new THREE.Group();
	group.name = 'Terminator';
	scene.add(group);

	const shadowGeo = new THREE.SphereGeometry(scale, circleDetail, circleDetail, Math.PI / 2, Math.PI, 0, Math.PI);
	const shadowMat = new THREE.MeshBasicMaterial({
		color: 0x000000,
		transparent: true,
		depthWrite: false,
		opacity: 0.25
	}); 
	const shadow = new THREE.Mesh( shadowGeo, shadowMat );
	shadow.name = 'Shadow';
	shadow.rotation.z = radians(-declination);
	shadow.renderOrder = 1;
	group.add(shadow);
}

function createRing(celestialObject) {
	if (celestialObject.RING === null) return;

	const inner = celestialObject.RING['radius-inner'] / celestialObject.BODY_RADIUS;
	const outer = celestialObject.RING['radius-outer'] / celestialObject.BODY_RADIUS;

	const geometry = new THREE.RingGeometry(inner, outer, 90); 
	const material = new THREE.MeshBasicMaterial({ 
		color: 0xA9A9A9,
		transparent: true,
		depthWrite: false,
		opacity: 0.15,
		side: THREE.DoubleSide
	});
	const mesh = new THREE.Mesh( geometry, material );
	mesh.rotation.x = radians(90);
	scene.add( mesh );
}

function createStarfield(amount = 300) {
	let vertices = [];

	for (let i = 0; i < amount; i++) {
		let theta = random() * 2.0 * Math.PI;
		let phi = Math.acos(2.0 * random() - 1.0);
		let r = Math.cbrt(random()) * 1500;
		let c = convertPolarToCartesian(degrees(theta), degrees(phi), r);
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
	mesh.name = 'Starfield';
	mesh.visible = document.getElementById('map-settings-show-starfield').checked;
}

function createLocationLabels(celestialObject) {
	let r = celestialObject.BODY_RADIUS;
	let locations = DB.locations.filter(loc => loc.PARENT === celestialObject);

	for (let i = 0; i < locations.length; i++) {

		const container = document.createElement('div');
		container.className = 'mapLocationLabel';
		container.dataset.location = locations[i].NAME;
		container.dataset.occluded = true;

		container.addEventListener('mouseenter', () => {
			UI.showMapLocationData(locations[i], container);
		});

		container.addEventListener('mouseleave', UI.hideMapLocationData);

		container.addEventListener('pointerdown', () => {
			UI.setMapLocation(locations[i].NAME);
			setCameraAboveActiveLocation(true);
		});

		const name = document.createElement('p');
		container.append(name);
		name.className = 'mapLocationName';
		name.innerText = locations[i].NAME;

		const icon = document.createElement('div');
		container.append(icon);
		icon.className = 'mapLocationIcon';
		setLocationIcon(locations[i].TYPE, icon);

		const time = document.createElement('p');
		container.append(time);
		time.className = 'mapLocationTime';
		time.innerText = 'XX:XX';

		time.dataset.visible = document.getElementById('map-settings-show-times').checked;

		const pos = locations[i].COORDINATES_3DMAP;
		const locationLabel = new CSS2DObject(container);
		locationLabel.position.copy(new THREE.Vector3(pos.x, pos.z, pos.y));
		scene.add(locationLabel);
	}
}

function setLocationIcon(type, element) {
	if (
		type === 'Underground bunker' ||
		type === 'Emergency shelter' ||
		type === 'Outpost' ||
		type === 'Prison' ||
		type === 'Shipwreck' ||
		type === 'Scrapyard'
	) {
		element.classList.add('icon-outpost');

	} else if (
		type === 'Space station' ||
		type === 'Asteroid base'
	) {
		element.classList.add('icon-spacestation');

	} else if (type === 'Landing zone') {
		element.classList.add('icon-landingzone');

	} else if (type === 'Settlement') {
		element.classList.add('icon-settlement');

	} else if (type === 'Distribution center') {
		element.classList.add('icon-distribution-center');

	} else if (type === 'Cave') {
		element.classList.add('icon-cave');
		
	} else {
		element.classList.add('icon-space');
	}
}

function createOrbitalMarkerLabels() {
	// let orbitalMarkerCoordinates = [
	// 	{ x:  0, y:  0,  z:  omDistance },
	// 	{ x:  0, y:  0,  z: -omDistance },
	// 	{ x:  0, y:  omDistance,  z:  0 },
	// 	{ x:  0, y: -omDistance,  z:  0 },
	// 	{ x: -omDistance, y:  0,  z:  0 },
	// 	{ x:  omDistance, y:  0,  z:  0 },
	// ];

	let group = new THREE.Group();
	group.name = 'Orbital Markers';

	for (let i = 0; i < 6; i++) {
		let coords = orbitalMarkerCoordinates[i];
		let x = coords.x;
		let y = coords.y;
		let z = coords.z;

		let labelDiv = document.createElement('div');
		labelDiv.className = 'mapOrbitalMarker';
		labelDiv.textContent = `OM${i + 1}`;

		labelDiv.dataset.visible = document.getElementById('map-settings-show-orbitalmarkers').checked;

		let nameLabel = new CSS2DObject(labelDiv);
		let nameLabelPosition = new THREE.Vector3(x, z, y);
		nameLabel.position.copy(nameLabelPosition);
		group.add(nameLabel);
	}

	scene.add(group);
}


function setCameraAboveActiveLocation(customScalar = false) {
	const coord = Settings.activeLocation.COORDINATES_3DMAP;
	let camVector = new THREE.Vector3(coord.x, coord.z, coord.y);
	camVector.normalize();

	const scalar = customScalar ? camera.position.length() : 3;
	camVector.multiplyScalar(scalar);
	camera.position.set(camVector.x, camVector.y, camVector.z);
}



// MAP SETTINGS
document.getElementById('map-settings-planet-transparency').addEventListener('change', function() {
	Settings.save('mapPlanetTransparency', document.getElementById('map-settings-planet-transparency').value);
	document.dispatchEvent(new CustomEvent('redrawMapTexture'));
});

function redrawMapTexture() {
	const opacityPercent = document.getElementById('map-settings-planet-transparency').value / 100;
	let planetMesh = scene.getObjectByName('Textured Sphere');
	const texturePath = Settings.getCelestialBodyTexturePath(Settings.activeLocation.PARENT);

	let loader = new THREE.TextureLoader();
	let newPlanetMaterial;
	loader.load(texturePath, function (texture) {
		texture.colorSpace = THREE.SRGBColorSpace;

		newPlanetMaterial = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true,
			opacity: opacityPercent
		});

		planetMesh.material.dispose();
		planetMesh.material = newPlanetMaterial;
	});
}

document.getElementById('map-settings-show-grid').addEventListener('change', function() {
	Settings.save('mapGrid', document.getElementById('map-settings-show-grid').checked);

	let object = scene.getObjectByName('Grid');
	object.visible = document.getElementById('map-settings-show-grid').checked;
});

document.getElementById('map-settings-show-terminator').addEventListener('change', function() {
	Settings.save('mapTerminator', document.getElementById('map-settings-show-terminator').checked);
});

document.getElementById('map-settings-show-orbitalmarkers').addEventListener('change', function() {
	Settings.save('mapOMs', document.getElementById('map-settings-show-orbitalmarkers').checked);

	let markers = document.querySelectorAll('.mapOrbitalMarker');
	markers.forEach(element => {
		element.dataset.visible = document.getElementById('map-settings-show-orbitalmarkers').checked;
	});
});

document.getElementById('map-settings-show-times').addEventListener('change', function() {
	Settings.save('mapTimes', document.getElementById('map-settings-show-times').checked);

	let labels = document.querySelectorAll('.mapLocationTime');
	labels.forEach(element => {
		element.dataset.visible = document.getElementById('map-settings-show-times').checked;
	});
});

document.getElementById('map-settings-show-starfield').addEventListener('change', function() {
	Settings.save('mapStars', document.getElementById('map-settings-show-starfield').checked);

	let object = scene.getObjectByName('Starfield');
	object.visible = document.getElementById('map-settings-show-starfield').checked;
});
