import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { TrackballControls }  from 'three/addons/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';
// import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer';

import { RADIANS, ROUND, DISTANCE_3D, makeLine, makeCircle, getCelestialBodiesInSystem, getLocationsInSystem } from './HelperFunctions.js';
import SolarSystem from './classes/SolarSystem.js';

// NOTE: map-window CSS CLASS MIS-USED AS ID; CREATE map-container AND ADJUST CODE WHERE APPLICABLE


let scene, camera, renderer, labelRenderer, controls, zoomControls;
let atlasDiv = document.getElementById('atlas-container');

const mapScale = 10_000_000;
let focusBody = null;
let focusSystem = null;

// TODO:
// switch to distance-based label visibility determination first, and only ever add location labels for currently selected location
// focus levels -> for easy scale changing. Ex: Galaxy, System, Planet, Moon (?), Location
// current location indicator with quick selections to move up along the hierarchy
// tree view list of objects/locations in system

init();
render();

window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

function init() {
	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('#101016');

	labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	atlasDiv.appendChild( labelRenderer.domElement );

	camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.000001, 1000);
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
	zoomControls.zoomSpeed = 0.5;
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

	if (!showAtlasWindow) return;

	updateDebugInfo();
}

function updateDebugInfo() {
	setText('atlas-zoom', 'Zoom: ' + ROUND(controls.getDistance(), 4));
	setText('atlas-focus-system', `Selected System: ${focusSystem.NAME}`);
	setText('atlas-focus-object', `Selected Body: ${focusBody ? focusBody.NAME : 'none'}`);


	const start = window.performance.now();
	const organized = organizeLabels();
	const end = window.performance.now();
	
	let allLabels = document.querySelectorAll('.atlas-label');
	allLabels = [...allLabels];
	const visibleLabels = document.querySelectorAll('.atlas-label[data-visible="true"]');

	if (organized) {
		setText('atlas-label-render', `${allLabels.length} labels / ${visibleLabels.length} visible / time: ${ROUND(end - start, 3)} ms`);
	}
}

document.addEventListener('createAtlasScene', function (e) {
	createAtlasScene();
});

function setFocus(object, zoomToObject = false) {
	setFocus_moveCamera(object, zoomToObject);

	// SET GLOBALS
	if (object instanceof SolarSystem) {
		focusSystem = object;
		focusBody = getBodyByName(object.NAME);
	} else {
		const systemName = (object.TYPE === 'Star') ? object.NAME : object.PARENT_STAR.NAME;
		focusSystem = getSystemByName(systemName);
		focusBody = object;
	}

	// UPDATE UI
	const el = document.getElementById('atlas-hierarchy');

	if (object instanceof SolarSystem || object.TYPE === 'Star') {
		el.innerText = object.NAME;
	} else if (object.TYPE === 'Planet' || object.TYPE === 'Jump Point') {
		el.innerText = `${focusSystem.NAME} ▸ ${focusBody.NAME}`;
	} else {
		el.innerText = `${focusSystem.NAME} ▸ ${focusBody.PARENT.NAME} ▸ ${focusBody.NAME}`;
	}
}

function setFocus_moveCamera(object, zoomToObject) {
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

	if (!zoomToObject) {
		controls.target.copy(target);
		controls.update();
		zoomControls.target.copy(target);
		zoomControls.update();

	} else {
		console.error('Parameter "zoomToObject" not implemented!\nDoing regular camera move.');
		controls.target.copy(target);
		controls.update();
		zoomControls.target.copy(target);
		zoomControls.update();
	}
}



function createAtlasScene() {
	if (scene.children.length !== 0) return;

	for (const system of window.SYSTEMS) {
		createSolarSystem(system);
	}

	createCircularGrid(300, 25);
	createLollipops();
	createLabels();

	setFocus(getBodyByName('Stanton'));
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
		createCelestialBody(body, group);
		createOrbitLine(body, orbitLineGroup);
	}
}


function createCelestialBody(body, group) {
	const radius = (body.TYPE === 'Jump Point' || body.TYPE === 'Lagrange Point') ? 0.1 : body.BODY_RADIUS;
	const materialColor = (body.TYPE === 'Star') ? `rgb(230, 200, 140)` : `rgb(${body.THEME_COLOR.r}, ${body.THEME_COLOR.g}, ${body.THEME_COLOR.b})`;

	const geo = new THREE.SphereGeometry(radius, 24, 24);
	const mat = new THREE.MeshBasicMaterial({
		color: materialColor,
	});
	const object = new THREE.Mesh(geo, mat);
	object.name = body.NAME;

	object.position.set(body.COORDINATES.x, body.COORDINATES.y, body.COORDINATES.z);
	group.add(object);
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
		opacity: 0.075
	});

	for (const system of window.SYSTEMS) {
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

function createLabels() {
	for (const system of window.SYSTEMS) {
		createLabel_SolarSystem(system);
	}

	for (const body of window.BODIES) {
		const systemName = (body.TYPE === 'Star') ? body.NAME : body.PARENT_STAR.NAME;
		const group = scene.getObjectByName(`SYSTEM:${systemName}`);
		createLabel_CelestialBody(body, group);
	}
}

function createLabel_SolarSystem(system) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	div.classList.add('atlas-label-system');
	div.dataset.objectType = 'Solar System';

	div.addEventListener('pointerdown', (event) => {
		if (event.button === 0) {
			setFocus(system);
		}
		
	});

	/*const iconElement = document.createElement('div');
	iconElement.classList.add('mapLocationIcon');
	setBodyIcon('Star', iconElement);
	div.appendChild(iconElement);*/

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = system.NAME;
	div.appendChild(nameElement);

	const label = new CSS2DObject(div);
	label.position.copy(new THREE.Vector3(system.COORDINATES.x, system.COORDINATES.y, system.COORDINATES.z));

	scene.add(label);
}

function createLabel_CelestialBody(body, group) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	div.classList.add('atlas-label-system');
	div.dataset.objectType = body.TYPE;
	div.dataset.systemName = body.TYPE === 'Star' ? body.NAME : body.PARENT_STAR.NAME;
	div.dataset.parentName = body.TYPE === 'Star' ? null : body.PARENT.NAME;
	div.dataset.objectName = body.NAME;

	div.addEventListener('pointerdown', (event) => {
		if (event.button === 0) {
			setFocus(body);
		}
	});

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = body.NAME;
	div.appendChild(nameElement);

	const label = new CSS2DObject(div);
	const labelPosition = new THREE.Vector3(body.COORDINATES.x, body.COORDINATES.y,	body.COORDINATES.z);
	label.position.copy(labelPosition);

	group.add(label);
}









function setBodyIcon(type, element) {
	element.style.width = '10px';
	element.style.height = '10px';
	element.style.marginBottom = '2px';

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
	scene.getObjectByName('Lollipops').visible = visibility;
	scene.getObjectByName('Galaxy Grid').visible = visibility;

	for (const sys of window.SYSTEMS) {
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
			if (distance > 15) {
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

				const thisDistance = DISTANCE_3D(labels[index].dataset.x, labels[index].dataset.y, labels[index].dataset.z, camPos.x, camPos.y, camPos.z, true);
				const otherDistance = DISTANCE_3D(labels[otherIndex].dataset.x, labels[otherIndex].dataset.y, labels[otherIndex].dataset.z, camPos.x, camPos.y, camPos.z, true);

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