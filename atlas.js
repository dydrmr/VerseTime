import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { TrackballControls }  from 'three/addons/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';

import { round, calculateDistance3D, makeLine, makeCircle, getCelestialBodiesInSystem, getSystemByName, getBodyByName, readableNumber, random, convertPolarToCartesian, degrees, radians } from './HelperFunctions.js';
import Settings from './classes/app/Preferences.js';
import DB from './classes/app/Database.js';
import UI from './classes/app/UserInterface.js';
import SolarSystem from './classes/SolarSystem.js';


let scene, camera, renderer, labelRenderer, controls, zoomControls;
const atlasDiv = UI.el('atlas-container');
const infoBox = UI.el('atlas-hoverinfo');

const mapScale = 10_000_000;
let focusBody = null;
let focusSystem = null;

const planetObjects = Array();

const labelsSystems = Array();
const labelsStars = Array();
const labelsPlanets = Array();
const labelsMoons = Array();

// TODO:
// focus levels -> for easy scale changing. Ex: Galaxy, System, Planet, Moon (?), Location
// current location indicator: quick selections to move up along the hierarchy
// tree list of objects/locations in system
// NOTE: map-window CSS CLASS MIS-USED AS ID; CREATE map-container AND ADJUST CODE WHERE APPLICABLE

setup();
render();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

function setup() {
	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('#101016');

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	atlasDiv.appendChild( labelRenderer.domElement );

	camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.000001, 1500);
	camera.up.set(0, 0, 1);
	camera.position.set(0, -100, 50);
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
	zoomControls.zoomSpeed = 1.5;
	zoomControls.maxDistance = 500;
	zoomControls.minDistance = 0.0001;
	zoomControls.zoomDampingFactor = 0.2;
	zoomControls.smoothZoomSpeed = 5.0;

	atlasDiv.appendChild( renderer.domElement );
}

function render() {
	const target = controls.target;
	controls.update();
	zoomControls.target.set(target.x, target.y, target.z);
	zoomControls.update();

	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
	requestAnimationFrame(render);

	if (!UI.Atlas.show) return;

	updateDebugInfo();
	updateBodyRotation();
}

function updateDebugInfo() {
	if (!focusSystem) return;

	UI.setText('atlas-zoom', 'Zoom: ' + round(controls.getDistance(), 4));
	UI.setText('atlas-focus-system', `Selected System: ${focusSystem.NAME}`);
	UI.setText('atlas-focus-object', `Selected Body: ${focusBody ? focusBody.NAME : 'none'}`);

	
	const start = window.performance.now();
	const organized = organizeLabels();
	
	let allLabels = document.querySelectorAll('.atlas-label');
	allLabels = [...allLabels];
	const visibleLabels = document.querySelectorAll('.atlas-label[data-visible="true"]');
	const end = window.performance.now();

	if (organized) {
		UI.setText('atlas-label-render', `${allLabels.length} labels / ${visibleLabels.length} visible / time: ${round(end - start, 3)} ms`);
	}
}

function updateBodyRotation() {
	for (const container of planetObjects) {
		const body = container.userData.celestialBody;
		const rotation = body.ZENITH_LONGITUDE(body.PARENT_STAR);
		container.rotation.z = radians(-rotation);

		/*if (body.NAME === 'Hurston') {
			console.log(`${body.NAME} : ${rotation}`);
		}*/
	}
}




function setFocus(object) {

	// SET GLOBALS
	if (object instanceof SolarSystem) {
		focusSystem = object;
		focusBody = getBodyByName(object.NAME);
	} else {
		const systemName = (object.TYPE === 'Star') ? object.NAME : object.PARENT_STAR.NAME;
		focusSystem = getSystemByName(systemName);
		focusBody = object;
		//console.log(focusSystem, focusBody);
	}

	// UPDATE UI
	const el = UI.el('atlas-hierarchy');

	if (object instanceof SolarSystem || object.TYPE === 'Star') {
		el.innerText = object.NAME;
	} else if (object.TYPE === 'Planet' || object.TYPE === 'Jump Point') {
		el.innerText = `${focusSystem.NAME} ▸ ${focusBody.NAME}`;
	} else {
		el.innerText = `${focusSystem.NAME} ▸ ${focusBody.PARENT.NAME} ▸ ${focusBody.NAME}`;
	}

	setFocus_moveCamera(object);
}

function setFocus_moveCamera(object) {
	let target = null;

	if (object instanceof SolarSystem) {
		let body = null;
		body = getBodyByName(object.NAME);

		if (!body) {
			target = new THREE.Vector3(object.COORDINATES.x, object.COORDINATES.y, object.COORDINATES.z);
		} else {
			target = new THREE.Vector3();
			const mesh = scene.getObjectByName(object.NAME);
			mesh.getWorldPosition(target);
		}

	} else {
		target = new THREE.Vector3();
		const mesh = scene.getObjectByName(object.NAME);
		mesh.getWorldPosition(target);
	}

	controls.target.copy(target);
	controls.update();
	zoomControls.target.copy(target);
	zoomControls.update();
}



function showInfobox(object, event) {
	moveInfobox(event);
	populateInfobox(object);
	infoBox.style.opacity = '1';
}

function moveInfobox(event) {
	const rect = event.target.getBoundingClientRect();

	infoBox.style.left = `${rect.right}px`;
	infoBox.style.top = `${rect.top}px`;
}

function populateInfobox(object) {
	infoBox.innerText = '';

	if (object instanceof SolarSystem) {
		infoBox.innerText = 'Solar System';
	} else {
		infoBox.innerText = object.TYPE;
	}


	let distance = null;
	let distanceUnit = null;

	if (object !== focusBody && object !== focusSystem) {
		let here = null;
		let there = null;

		if (object instanceof SolarSystem) {
			here = focusSystem.COORDINATES;
			there = object.COORDINATES;
			distanceUnit = 'ly';

		} else {
			here = { 'x': focusBody.COORDINATES.x * 1000, 'y': focusBody.COORDINATES.y * 1000, 'z': focusBody.COORDINATES.z * 1000 };
			there = { 'x': object.COORDINATES.x * 1000, 'y': object.COORDINATES.y * 1000, 'z': object.COORDINATES.z * 1000 };
			distanceUnit = 'm';
		}

		distance = calculateDistance3D(here.x, here.y, here.z, there.x, there.y, there.z, false);
		distance = readableNumber(distance, distanceUnit);
	}

	if (distance) {
		infoBox.innerText += `\nDISTANCE: ${distance}`;
	}

	if (object instanceof SolarSystem) {
		infoBox.innerText += `\nAFFILIATION: ${object.AFFILIATION}`;
	}

	if (object instanceof SolarSystem) {
		const jps = DB.wormholes.filter((wh) => {
			if (wh.SYSTEM1.NAME === object.NAME || wh.SYSTEM2.NAME === object.NAME) {
				return true;
			}
		})

		if (jps.length > 0) {
			infoBox.innerText += `\nJUMP POINTS: ${jps.length}`;
		}
	}

	if (object instanceof SolarSystem) {
		const planets = DB.bodies.filter((body) => {
			if (
				body.TYPE === 'Planet' &&
				body.PARENT_STAR.NAME === object.NAME
			) {
				return true;
			}
		});

		if (planets.length > 0) {
			infoBox.innerText += `\nPLANETS: ${planets.length}`;
		}
	}

	if (object.TYPE === 'Planet') {
		const moons = DB.bodies.filter((body) => {
			if (
				body.TYPE === 'Moon' &&
				body.PARENT.NAME === object.NAME
			) {
				return true;
			}
		});

		if (moons.length > 0) {
			infoBox.innerText += `\nMOONS: ${moons.length}`;
		}
	}
}

function hideInfobox() {
	infoBox.style.opacity = '0';
}



document.addEventListener('createAtlasScene', () => {
	createAtlasScene();
});
async function createAtlasScene() {
	if (scene.children.length !== 0) return;

	createStarfield();
	createStars();

	for (const system of DB.systems) {
		await createSolarSystem(system);
	}
	
	createWormholeLines();
	createCircularGrid(300, 25);
	createLollipops();
	createLabels();

	setTimeout(() => {
		setFocus(getBodyByName('Hurston'));
	}, '250');
}

function createStarfield() {
	const group = new THREE.Group();
	group.name = 'Starfield';
	scene.add(group);

	let vertices = [];

	for (let i = 0; i < 300; i++) {
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
	group.add(mesh);
	//group.visible = document.getElementById('atlas-settings-show-starfield').checked;
}

function createStars() {
	const group = new THREE.Group();
	group.name = 'STARS';
	scene.add(group);

	for (const star of DB.stars) {
		if (!star.PARENT_SYSTEM) continue;

		let pos;
		if (isNaN(star.COORDINATES.x)) {
			pos = { 'x': 0, 'y': 0, 'z': 0 }
		} else {
			pos = {
				'x': star.COORDINATES.x / mapScale,
				'y': star.COORDINATES.y / mapScale,
				'z': star.COORDINATES.z / mapScale
			};
		}

		let radius;
		if (isNaN(star.BODY_RADIUS)) {
			radius = 10000;
		} else if (star.BODY_RADIUS > 10_000_000) {
			radius = 10_000_000;
		} else {
			radius = star.BODY_RADIUS;
		}

		const sysPos = star.PARENT_SYSTEM.COORDINATES;

		const geo = new THREE.SphereGeometry(radius / mapScale, 24, 24);
		const mat = new THREE.MeshBasicMaterial({
			color: `rgb(240, 220, 180)`,
		});

		const object = new THREE.Mesh(geo, mat);
		object.position.set(pos.x + sysPos.x, pos.y + sysPos.y, pos.z + sysPos.z);
		group.add(object);
	}
}

function createSolarSystem(system) {
	const bodies = getCelestialBodiesInSystem(system.NAME);
	if (bodies.length === 0) return;

	const group = new THREE.Group();
	group.name = `SYSTEM:${system.NAME}`;
	group.position.set(system.COORDINATES.x, system.COORDINATES.y, system.COORDINATES.z);
	group.scale.setScalar(1 / mapScale);
	scene.add(group);

	const orbitLineGroup = new THREE.Group();
	orbitLineGroup.name = `ORBITLINES:${system.NAME}`;
	group.add(orbitLineGroup);

	for (const body of bodies) {
		//createCelestialBody(body, group);
		createCelestialBodyWithContainer(body, group);
		createOrbitLine(body, orbitLineGroup);
	}
}


async function createCelestialBody(body, group) {
	let radius;
	if (body.TYPE === 'Jump Point' || body.TYPE === 'Lagrange Point' || body.TYPE === 'Star') {
		radius = 0.01;
	} else {
		radius = body.BODY_RADIUS
	}

	const geo = new THREE.SphereGeometry(radius, 36, 36);
	const mat = await createCelestialObjectMaterial(body);

	const bodyMesh = new THREE.Mesh(geo, mat);
	bodyMesh.name = body.NAME;

	if (body.TYPE === 'Planet' || body.TYPE === 'Moon') {
		// compensate for z = up coordinate system in THREE.js
		bodyMesh.rotateX(Math.PI / 2);
		bodyMesh.rotateY(Math.PI);
		planetObjects.push(bodyMesh);
	}

	bodyMesh.position.set(body.COORDINATES.x, body.COORDINATES.y, body.COORDINATES.z);
	group.add(bodyMesh);
}

async function createCelestialBodyWithContainer(body, group) {
	let radius;
	if (body.TYPE === 'Jump Point' || body.TYPE === 'Lagrange Point' || body.TYPE === 'Star') {
		radius = 0.01;
	} else {
		radius = body.BODY_RADIUS
	}

	const bodyContainer = new THREE.Group();
	bodyContainer.name = `BODYCONTAINER:${body.NAME}`;
	bodyContainer.position.set(body.COORDINATES.x, body.COORDINATES.y, body.COORDINATES.z);
	group.add(bodyContainer);

	const geo = new THREE.SphereGeometry(radius, 36, 36);
	const mat = await createCelestialObjectMaterial(body);

	const bodyMesh = new THREE.Mesh(geo, mat);
	bodyMesh.name = body.NAME;
	bodyContainer.add(bodyMesh);
	bodyContainer.userData.celestialBody = body;

	if (body.TYPE === 'Planet' || body.TYPE === 'Moon') {
		// compensate for z = up coordinate system in THREE.js
		bodyMesh.rotateX(Math.PI / 2);
		bodyMesh.rotateY(Math.PI);
		planetObjects.push(bodyContainer);
	}
}

async function createCelestialObjectMaterial(body) {
	let material;

	if (body.TYPE === 'Planet' || body.TYPE === 'Moon') {
		const loader = new THREE.TextureLoader();
		const file = 'static/assets/' + body.NAME.toLowerCase() + '.webp';
		let texture;

		try {
			texture = await loader.loadAsync(file);
			texture.colorSpace = THREE.SRGBColorSpace;
			material = new THREE.MeshBasicMaterial({
				map: texture
			})

		} catch (e) {
			const materialColor = (body.TYPE === 'Star') ? `rgb(230, 200, 140)` : `rgb(${body.THEME_COLOR.r}, ${body.THEME_COLOR.g}, ${body.THEME_COLOR.b})`;
			material = new THREE.MeshBasicMaterial({
				color: materialColor,
			});

			return material;
		}

	} else {
		const materialColor = (body.TYPE === 'Star') ? `rgb(230, 200, 140)` : `rgb(${body.THEME_COLOR.r}, ${body.THEME_COLOR.g}, ${body.THEME_COLOR.b})`;
		material = new THREE.MeshBasicMaterial({
			color: materialColor,
		});
	}

	return material;
}

function createCircularGrid(size, spacing) {
	const group = new THREE.Group();
	group.name = 'Galaxy Grid';
	scene.add(group);

	const material = new THREE.LineBasicMaterial({
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.075
	});

	const halfSize = size / 2;

	const xAxis = makeLine(-halfSize, 0, 0, halfSize, 0, 0, material);
	group.add(xAxis);

	const yAxis = makeLine(0, -halfSize, 0, 0, halfSize, 0, material);
	group.add(yAxis);

	for (let radius = spacing; radius <= halfSize; radius += spacing) {
		const circle = makeCircle(radius, 120, 0, 0, 0, 0, 0, 0, material);
		group.add(circle);
	}

}

function createLollipops(size = 0.5) {
	const group = new THREE.Group();
	group.name = 'Lollipops';
	scene.add(group);

	const material = new THREE.LineBasicMaterial({
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.05
	});

	for (const system of DB.systems) {
		if (system.NAME === 'Sol') continue;

		// Stalk
		const line = makeLine(system.COORDINATES.x, system.COORDINATES.y, system.COORDINATES.z, system.COORDINATES.x, system.COORDINATES.y, 0, material);
		group.add(line);

		// Cross
		const cross1 = makeLine(system.COORDINATES.x, system.COORDINATES.y - size, 0, system.COORDINATES.x, system.COORDINATES.y + size, 0, material);
		group.add(cross1);
		const cross2 = makeLine(system.COORDINATES.x - size, system.COORDINATES.y, 0, system.COORDINATES.x + size, system.COORDINATES.y, 0, material);
		group.add(cross2);
	}
}

function createOrbitLine(body, group) {
	if (
		!body.PARENT ||
		body.TYPE === 'Lagrange Point' ||
		body.TYPE === 'Jump Point'
	) {
		return;
	}

	const material = new THREE.LineBasicMaterial({
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.05
	});

	const center = body.PARENT.TYPE === 'Star' ? { 'x': 0, 'y': 0, 'z': 0 } : body.PARENT.COORDINATES;
	const radius = body.ORBITAL_RADIUS;
	const circle = makeCircle(radius, 240, center.x, center.y, center.z, 0, 0, 0, material);
	group.add(circle);
}

function createWormholeLines(precise = false) {
	const group = new THREE.Group();
	group.name = 'Wormholes';
	scene.add(group);

	for (const wormhole of DB.wormholes) {
		let p1 = null;
		let p2 = null;

		if (precise) {
			console.error('Precise wormhole lines not implemented!');

		} else {
			p1 = wormhole.SYSTEM1.COORDINATES;
			p2 = wormhole.SYSTEM2.COORDINATES;
		}

		let lineColor = null;
		if (wormhole.SIZE === 'S') {
			lineColor = `red`;
		} else if (wormhole.SIZE === 'M') {
			lineColor = 'yellow';
		} else if (wormhole.SIZE === 'L') {
			lineColor = 'green';
		} else {
			lineColor = 'violet';
		}

		const material = new THREE.LineBasicMaterial({
			color: lineColor,
			transparent: true,
			opacity: 0.15
		});

		const line = makeLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, material);
		group.add(line);
	}
}


function createLabels() {
	for (const system of DB.systems) {
		createLabel_SolarSystem(system);
	}

	for (const body of DB.bodies) {
		const systemName = (body.TYPE === 'Star') ? body.NAME : body.PARENT_STAR.NAME;
		const group = scene.getObjectByName(`SYSTEM:${systemName}`);
		createLabel_CelestialBody(body, group);
	}

	for (const location of DB.locations) {
		const systemName = location.PARENT_STAR.NAME;
		const group = scene.getObjectByName(`SYSTEM:${systemName}`);
		createLabel_Location(location, group);
	}
}

function createLabel_SolarSystem(system) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	div.classList.add('atlas-label-system');
	div.dataset.objectType = 'Solar System';
	div.dataset.affiliation = system.AFFILIATION;

	setLabelEvents(div, system);

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = system.NAME;
	div.appendChild(nameElement);

	const label = new CSS2DObject(div);
	label.position.copy(new THREE.Vector3(system.COORDINATES.x, system.COORDINATES.y, system.COORDINATES.z));

	scene.add(label);
	labelsSystems.push(div);
}

function createLabel_CelestialBody(body, group) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	//div.classList.add('atlas-label-system');
	div.dataset.objectType = body.TYPE;
	div.dataset.systemName = body.TYPE === 'Star' ? body.NAME : body.PARENT_STAR.NAME;
	div.dataset.parentName = body.TYPE === 'Star' ? null : body.PARENT.NAME;
	div.dataset.objectName = body.NAME;

	setLabelEvents(div, body);

	/*const iconElement = document.createElement('div');
	iconElement.classList.add('mapLocationIcon');
	setBodyIcon(body.TYPE, iconElement);
	iconElement.style.marginTop = '15px';
	div.appendChild(iconElement);*/

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = body.NAME;
	div.appendChild(nameElement);

	const label = new CSS2DObject(div);
	const labelPosition = new THREE.Vector3(body.COORDINATES.x, body.COORDINATES.y,	body.COORDINATES.z);
	label.position.copy(labelPosition);

	group.add(label);

	if (body.TYPE === 'Star') {
		labelsStars.push(div);
	} else if (body.TYPE === 'Planet') {
		labelsPlanets.push(div);
	} else if (body.TYPE === 'Moon') {
		labelsMoons.push(div);
	}
}

function createLabel_Location(location, group) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	div.classList.add('atlas-label-location');
	div.dataset.objectType = 'Location';
	div.dataset.systemName = location.PARENT_STAR.NAME;
	div.dataset.parentName = location.PARENT.NAME;
	div.dataset.objectName = location.NAME;
	div.dataset.visible = false;

	setLabelEvents(div, location);

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = location.NAME;
	div.appendChild(nameElement);

	const label = new CSS2DObject(div);
	const labelPosition = new THREE.Vector3(
		location.COORDINATES.x + location.PARENT.COORDINATES.x,
		location.COORDINATES.y + location.PARENT.COORDINATES.y,
		location.COORDINATES.z + location.PARENT.COORDINATES.z
	);
	label.position.copy(labelPosition);

	/*if (location.PARENT.TYPE === 'Planet' || location.PARENT.TYPE === 'Moon') {
		const container = scene.getObjectByName(`BODYCONTAINER:${location.PARENT.NAME}`);
		container.add(label);
	} else {
		group.add(label);
	}*/
	group.add(label);
}

function setLabelEvents(domElement, targetObject) {
	domElement.addEventListener('pointerdown', (event) => {
		if (event.button === 0) {
			setFocus(targetObject);
		}
	});

	domElement.addEventListener('mouseenter', (event) => {
		showInfobox(targetObject, event);
	});

	domElement.addEventListener('mousemove', (event) => {
		moveInfobox(event);
	})

	domElement.addEventListener('mouseleave', (event) => {
		hideInfobox(targetObject);
	});
}

function setBodyIcon(type, element) {
	element.style.width = '10px';
	element.style.height = '10px';
	element.style.marginBottom = '2px';
	element.style.opacity = '0.7 !important';

	if (type === 'Star') {
		element.classList.add('icon-star');

	} else if (type === 'Planet' || type === 'Moon') {
		element.classList.add('icon-planet');

	} else if (type === 'Jump Point') {
		element.classList.add('icon-wormhole');

	} else {
		element.style.display = 'none';
	}
}




function organizeLabels() {
	if (renderer.info.render.frame % 5 !== 0) { return false; }

	// organizeLocationLabels();
	// organizeBodyLabels();

	organizeLabelsVersionTwo();

	return true;
}

function organizeLabelsVersionTwo() {
	const distance = controls.getDistance();

	const visibility = distance > 25 ? true : false;
	scene.getObjectByName('Lollipops').visible = (visibility && settingLolli.checked);
	scene.getObjectByName('Wormholes').visible = (visibility && settingWorm.checked);
	scene.getObjectByName('Galaxy Grid').visible = (visibility && settingGrid.checked);

	for (const sys of DB.systems) {
		if (sys.NAME === focusSystem.NAME) continue;

		const object = scene.getObjectByName(`SYSTEM:${sys.NAME}`);
		if (object) {
			object.visible = visibility;
		}
	}

	const allLabels = document.querySelectorAll('.atlas-label');
	for (const label of allLabels) {

		// FOCUS-BASED

		if (
			label.dataset.objectType !== 'Solar System' &&
			label.dataset.systemName !== focusSystem.NAME
		) {
			label.dataset.visible = false;
			continue;
		}

		if (
			label.dataset.objectType === 'Planet' &&
			label.dataset.systemName !== focusSystem.NAME
		) {
			label.dataset.visible = false;
			continue;
		}
		
		if (
			label.dataset.objectType === 'Moon' &&
			label.dataset.systemName !== focusSystem.NAME
		) {
			label.dataset.visible = false;
			continue;
		}

		// DISTANCE-BASED

		if (label.dataset.objectType === 'Solar System') {
			if (distance < 25) {
				label.dataset.visible = false;
				continue;
			}
		}

		if (
			label.dataset.objectType === 'Star' ||
			label.dataset.objectType === 'Planet'
		) {
			if (distance > 25) {
				label.dataset.visible = false;
				continue;
			}
		}

		if (
			label.dataset.objectType === 'Lagrange Point' ||
			label.dataset.objectType === 'Jump Point'
		) {
			if (distance > 12) {
				label.dataset.visible = false;
				continue;
			}
		}

		if (label.dataset.objectType === 'Moon') {
			if (distance > 0.5) {
				label.dataset.visible = false;
				continue;
			}
		}

		if (label.dataset.objectType === 'Location') {
			if (distance > 0.0075) {
				label.dataset.visible = false;
				continue;
			}
		}

		label.dataset.visible = true;
	}

	const visibleLables = document.querySelectorAll('.atlas-label[data-visible="true"]');
	for (const label of visibleLables) {
		// do overlap checking & prioritization here
	}
}

function organizeBodyLabels() {
	const ranks = ['Star', 'Planet', 'Jump Point', 'Lagrange Point', 'Moon', 'Location'];
	// const bodyLabels = document.querySelectorAll('.atlas-label-body');

	// for (let label of bodyLabels) {
	// 	label.dataset.visible = true;
	// }

	// const allLabels = document.querySelectorAll(".atlas-label");
	// const labels = []; //visible labels

	// for (let label of allLabels) {
	// 	if (label.dataset.visible === 'true') {
	// 		labels.push(label);
	// 	}
	// }

	const labels = document.querySelectorAll('.atlas-label-body');
	for (let label of labels) {
		label.dataset.visible = true;
		if (controls.getDistance() > 110 && label.dataset.objectType === 'Lagrange Point') {
			label.dataset.visible = false;
		}
	}

	for (let index = 0; index < labels.length - 1; index++) {

		if (labels[index].dataset.visible === false) {
			continue;
		}

		for (let otherIndex = index + 1; otherIndex < labels.length; otherIndex++) {

			if (labels[otherIndex].dataset.visible === false) {
				continue;
			}


			const thisPos = labels[index].getBoundingClientRect();
			const otherPos = labels[otherIndex].getBoundingClientRect();

			const notOverlapping = (thisPos.right < otherPos.left ||
				thisPos.left > otherPos.right ||
				thisPos.bottom < otherPos.top ||
				thisPos.top > otherPos.bottom);

			if (notOverlapping) { continue; }



			const thisRank = ranks.find((rank) => rank === labels[index].dataset.objectType);
			const otherRank = ranks.find((rank) => rank === labels[otherIndex].dataset.objectType);

			if (thisRank > otherRank) {
				labels[otherIndex].dataset.visible = false;

			} else if (thisRank < otherRank) {
				labels[index].dataset.visible = false;

			} else {
				const camPos = camera.position;

				const thisDistance = calculateDistance3D(labels[index].dataset.x, labels[index].dataset.y, labels[index].dataset.z, camPos.x, camPos.y, camPos.z, true);
				const otherDistance = calculateDistance3D(labels[otherIndex].dataset.x, labels[otherIndex].dataset.y, labels[otherIndex].dataset.z, camPos.x, camPos.y, camPos.z, true);

				if (thisDistance > otherDistance) {
					labels[index].dataset.visible = false;
				} else {
					labels[otherIndex].dataset.visible = false;
				}

			}

		}

	}
}

function organizeLocationLabels() {
	const labels = document.querySelectorAll('.atlas-label-location');

	if (controls.getDistance() > 1) {
		for (let label of labels) {
			label.dataset.visible = false;
		}
		return;
	}

	for (let label of labels) {
		if (focusedBody !== label.dataset.bodyName) {
			label.dataset.visible = false;
			continue;
		}

		label.dataset.visible = true;
	}
}



// EVENT LISTENERS
const settingLolli = UI.el('atlas-settings-show-lollipops');
settingLolli.addEventListener('change', function () {
	Settings.save('atlasLollipops', settingLolli.checked);
	const mesh = scene.getObjectByName('Lollipops');
	mesh.visible = settingLolli.checked;
});

const settingWorm = UI.el('atlas-settings-show-wormholes');
settingWorm.addEventListener('change', function () {
	Settings.save('atlasWormholes', settingWorm.checked);
	const mesh = scene.getObjectByName('Wormholes');
	mesh.visible = settingWorm.checked;
});


const settingAffil = UI.el('atlas-settings-show-affiliation');
settingAffil.addEventListener('change', function () {
	const setting = settingAffil.checked;
	Settings.save('atlasAffiliation', setting);

	const labels = document.querySelectorAll('.atlas-label-system');
	for (const label of labels) {
		if (setting === true) {
			const sys = getSystemByName(label.textContent);
			label.dataset.affiliation = sys.AFFILIATION;
		} else {
			label.dataset.affiliation = 'disabled';
		}
	}	
});

const settingGrid = UI.el('atlas-settings-show-grid');
settingGrid.addEventListener('change', function () {
	Settings.save('atlasGrid', settingGrid.checked);
	const mesh = scene.getObjectByName('Galaxy Grid');
	mesh.visible = settingWorm.checked;
});

const settingStarfield = UI.el('atlas-settings-show-starfield');
settingStarfield.addEventListener('change', function () {
	Settings.save('atlasStarfield', settingStarfield.checked);
	const mesh = scene.getObjectByName('Starfield');
	mesh.visible = settingStarfield.checked;
});