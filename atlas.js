import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { TrackballControls }  from 'three/addons/controls/TrackballControls';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';
// import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer';

import { RADIANS, ROUND, DISTANCE_3D } from './HelperFunctions.js';


// NOTE: map-window CSS CLASS MIS-USED AS ID; CREATE map-container AND ADJUST CODE WHERE APPLICABLE


let scene, camera, renderer, labelRenderer, controls, zoomControls;
let atlasDiv = document.getElementById('atlas-container');

const mapScale = 1_000_000;
let focusedBody = null;

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

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 1_000_000);
	camera.up.set(0,0,1);
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
	zoomControls.maxDistance = 5_000;
	zoomControls.minDistance = 0.001;
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


	//TODO: SCALE CELESTIAL BODIES BASED ON ZOOM LEVEL
	updateDebugInfo();
}

function updateDebugInfo() {
	setText('atlas-zoom', 'Zoom: ' + ROUND(controls.getDistance(), 4));
	setText('atlas-focused-object', 'Focus: ' + String(focusedBody));


	/*const start = window.performance.now();
	const organized = organizeLabels();
	const end = window.performance.now();
	
	let allLabels = document.querySelectorAll('.atlas-label');
	allLabels = [...allLabels];

	const visibleLabels = [];
	for (let label of allLabels) {
		if (label.dataset.visible === 'true') {
			visibleLabels.push(label);
		}
	}

	if (organized) {
		setText('atlas-label-render', `${allLabels.length} labels / ${visibleLabels.length} visible / time: ${ROUND(end - start, 3)} ms`);
	}*/
}

document.addEventListener('createAtlasScene', function (e) {
	createAtlasScene();
});

function createAtlasScene() {
	if (scene.children.length !== 0) return;

	createGalaxyGrid(100);

	for (const system of window.SYSTEMS) {
		const geo = new THREE.SphereGeometry(1, 24, 24);
		const mat = new THREE.MeshBasicMaterial({
			color: `rgb(180, 50, 50)`,
		});
		const object = new THREE.Mesh(geo, mat);
		object.position.x = system.COORDINATES.x;
		object.position.y = system.COORDINATES.y;
		object.position.z = system.COORDINATES.z;
		scene.add(object);
	}

	console.log(scene);
}

function createGalaxyGrid(size) {
	const axisMaterial = new THREE.LineBasicMaterial({
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.2
	});

	const regularMaterial = new THREE.LineBasicMaterial({
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.05
	});

	const halfSize = size / 2;

	for (let x = -halfSize; x <= halfSize; x += 5) {
		const mat = (x === 0) ? axisMaterial : regularMaterial;
		const line = makeLine(x, -halfSize, 0, x, halfSize, 0, mat);
		scene.add(line);
	}

	for (let y = -halfSize; y <= halfSize; y += 5) {
		const mat = (y === 0) ? axisMaterial : regularMaterial;
		const line = makeLine(-halfSize, y, 0, halfSize, y, 0, mat);
		scene.add(line);
	}
}

function createLables() {

}






// OLD OLD OLD OLD OLD OLD
function createAtlasScene_version1() {
	scene.clear();
	const activeBody = window.ACTIVE_LOCATION.PARENT;
	const systemBodies = getCelestialBodiesInSystem(activeBody.PARENT_STAR.NAME);

	for (let body of systemBodies) {
		const rawPos = body.COORDINATES;
		const pos = {
			'x': rawPos.x / mapScale,
			'y': rawPos.y / mapScale,
			'z': rawPos.z / mapScale
		}

		createBody(body, mapScale, pos);
		createBodyLabel(body, pos);
	}

	createOrbitLines(systemBodies, mapScale);

	const systemLocations = getLocationsInSystem(activeBody.PARENT_STAR.NAME);
	for (let location of systemLocations) {
		const p1 = {
			'x': location.PARENT.COORDINATES.x / mapScale,
			'y': location.PARENT.COORDINATES.y / mapScale,
			'z': location.PARENT.COORDINATES.z / mapScale
		};

		const p2 = {
			'x': location.COORDINATES.x / mapScale,
			'y': location.COORDINATES.y / mapScale,
			'z': location.COORDINATES.z / mapScale
		}

		let pos = {
			'x': parseFloat(p1.x) + parseFloat(p2.x),
			'y': parseFloat(p1.y) + parseFloat(p2.y),
			'z': parseFloat(p1.z) + parseFloat(p2.z)
		}

		const div = document.createElement('div');
		div.classList.add('atlas-label');
		div.classList.add('atlas-label-location');
		div.innerText = location.NAME;
		div.dataset.visible = false;
		div.dataset.objectType = 'Location';
		div.dataset.bodyName = location.PARENT.NAME;
		div.dataset.x = pos.x;
		div.dataset.y = pos.y;
		div.dataset.z = pos.z;

		const locationLabel = new CSS2DObject(div);
		locationLabel.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z));
		scene.add(locationLabel);
	}

}

function createBody(body, mapScale, scenePosition) {
	const geo = new THREE.SphereGeometry(body.BODY_RADIUS / mapScale, 24, 24);
	const mat = new THREE.MeshBasicMaterial({
		color: `rgb(180, 30, 30)`,
	});
	const object = new THREE.Mesh(geo, mat);
	object.position.x = scenePosition.x;
	object.position.y = scenePosition.y;
	object.position.z = scenePosition.z;
	scene.add(object);
}

function createBodyLabel(body, scenePosition) {
	const div = document.createElement('div');
	div.classList.add('atlas-label');
	div.classList.add('atlas-label-body');
	div.dataset.visible = false;
	div.dataset.objectType = body.TYPE;
	div.dataset.x = scenePosition.x;
	div.dataset.y = scenePosition.y;
	div.dataset.z = scenePosition.z;

	const iconElement = document.createElement('div');
	iconElement.classList.add('mapLocationIcon');
	setBodyIcon(body.TYPE, iconElement);
	div.appendChild(iconElement);

	const nameElement = document.createElement('p');
	nameElement.classList.add('atlas-label-name');
	nameElement.innerText = body.NAME;
	div.appendChild(nameElement);

	div.addEventListener('pointerdown', () => {
		const target = new THREE.Vector3(scenePosition.x, scenePosition.y, scenePosition.z);
		controls.target.copy(target);
		controls.update();
		zoomControls.target.copy(target);
		zoomControls.update();

		focusedBody = body.NAME;
	});

	const bodyLabel = new CSS2DObject(div);
	bodyLabel.position.copy(new THREE.Vector3(scenePosition.x, scenePosition.y, scenePosition.z));
	scene.add(bodyLabel);
}

function setBodyIcon(type, element) {
	element.style.width = '18px';
	element.style.height = '18px';
	element.style.marginBottom = '4px';

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


function createOrbitLines(bodies, mapScale) {
	const material = new THREE.LineBasicMaterial( {
		color: `rgb(255, 255, 255)`,
		transparent: true,
		opacity: 0.05
	});

	for (const body of bodies) {
		if (
			!body.PARENT ||
			body.TYPE === 'Lagrange Point' ||
			body.TYPE === 'Jump Point'
		) { 
			continue;
		}

		const c = body.PARENT.COORDINATES;
		const center = {'x': c.x / mapScale, 'y': c.y / mapScale, 'z': c.z / mapScale};
		const radius = body.ORBITAL_RADIUS / mapScale;

		const p = [];
		for (let i = 0; i <= 360; i += 360 / 600) {
			let angle = RADIANS(i);
			let x = Math.sin(angle) * radius;
			let y = Math.cos(angle) * radius;
			let z = 0;
			p.push(new THREE.Vector3(x + center.x, y + center.y, 0));
			// NOTE: z-coordinate above is zero. Should be z + center.z.
			// However, Stanton's star is above the system plane, and the planet orbits aren't actually centered on it.
			// This creates coding headaches :/
			// Rule does not apply to Pyro
		}

		const geo = new THREE.BufferGeometry().setFromPoints(p);
		const circle = new THREE.Line(geo, material);
		scene.add(circle);
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
	const allLabels = document.querySelectorAll('.atlas-label');
	const distance = controls.getDistance();

	for (let label of allLabels) {
		label.dataset.visible = true;

		if (distance > 700 && label.dataset.objectType !== 'Star') {
			label.dataset.visible = false;
			continue;
		}

		if (distance > 110 && label.dataset.objectType === 'Lagrange Point') {
			label.dataset.visible = false;
			continue;
		}

		if (distance > 5 && label.dataset.objectType === 'Moon') {
			label.dataset.visible = false;
			continue;
		}

		if (distance > 0.5 && label.dataset.objectType === 'Location') {
			label.dataset.visible = false;
			continue;
		}

		if (label.dataset.objectType === 'Location' && label.dataset.bodyName !== focusedBody) {
			label.dataset.visible = false;
			continue;
		}
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

//TODO: MOVE TO HELPERS AND UNIFY WITH OLD MAP:
		function makeLine(x1, y1, z1, x2, y2, z2, mat) {
			const p = [];
			p.push(new THREE.Vector3(x1, y1, z1));
			p.push(new THREE.Vector3(x2, y2, z2));
			const geo = new THREE.BufferGeometry().setFromPoints(p);
			const line = new THREE.Line(geo, mat);
			return line;
		}

		

//TODO: MOVE TO HELPER SCRIPT ?
		function getCelestialBodiesInSystem(systemName) {
			const bodies = window.BODIES.filter(body => {
				if (
					body.NAME === systemName ||
					body.PARENT_STAR && body.PARENT_STAR.NAME === systemName
				) {
					return true;
				}
			});
			return bodies;
		}

		function getLocationsInSystem(systemName) {
			const locations = window.LOCATIONS.filter(loc => loc.PARENT_STAR.NAME === systemName);
			return locations;
		}
// END TODO