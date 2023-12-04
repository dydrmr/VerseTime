import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';

import { getLocationByName } from '../../HelperFunctions.js';
import DB from './Database.js';
import SolarSystem from '../SolarSystem.js';
import Star from '../Star.js';
import CelestialBody from '../CelestialBody.js';
import Location from '../Location.js';

class AtlasLabelManager {
    constructor() {
        if (AtlasLabelManager.instance) return AtlasLabelManager.instance;
        AtlasLabelManager.instance = this;

        this.scene = null;
        this.allLabels = Array();
    }

    createLabel(target, groupObject = null) {
        if (target instanceof SolarSystem) {
            this.#createLabel_SolarSystem(target);

        } else if (target instanceof CelestialBody) {
            this.#createLabel_CelestialBody(target, groupObject);

        } else if (target instanceof Location) {
            this.#createLabel_Location(target)
        }
    }

    #createLabel_SolarSystem(system) {
        const div = document.createElement('div');
        div.classList.add('atlas-label');
        div.classList.add('atlas-label-system');
        div.dataset.objectType = 'Solar System';
        div.dataset.affiliation = system.AFFILIATION;
        div.dataset.objectName = system.NAME;

        this.#setLabelEvents(div, system);

        const nameElement = document.createElement('p');
        nameElement.classList.add('atlas-label-name');
        nameElement.innerText = system.NAME;
        div.appendChild(nameElement);

        const label = new CSS2DObject(div);
        label.position.copy(new THREE.Vector3(system.COORDINATES.x, system.COORDINATES.y, system.COORDINATES.z));

        this.scene.add(label);
        this.allLabels.push(label);
    }

    #createLabel_CelestialBody(body, group) {
        const div = document.createElement('div');
        div.classList.add('atlas-label');
        //div.classList.add('atlas-label-system');
        div.dataset.objectType = body.TYPE;
        div.dataset.systemName = body.TYPE === 'Star' ? body.NAME : body.PARENT_STAR.NAME;
        div.dataset.parentName = body.TYPE === 'Star' ? null : body.PARENT.NAME;
        div.dataset.objectName = body.NAME;

        this.#setLabelEvents(div, body);

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
        const labelPosition = new THREE.Vector3(body.COORDINATES.x, body.COORDINATES.y, body.COORDINATES.z);
        label.position.copy(labelPosition);

        group.add(label);

        /*if (body.TYPE === 'Star') {
            labelsStars.push(div);
        } else if (body.TYPE === 'Planet') {
            labelsPlanets.push(div);
        } else if (body.TYPE === 'Moon') {
            labelsMoons.push(div);
        }*/

        this.allLabels.push(label);
    }

    #createLabel_Location(location) {
        const div = document.createElement('div');
        div.classList.add('atlas-label');
        div.dataset.objectType = 'Location';
        div.dataset.objectName = location.NAME;

       this.#setLabelEvents(div, location);

        const iconElement = document.createElement('div');
        iconElement.classList.add('mapLocationIcon');
        //setBodyIcon(location.TYPE, iconElement);
        iconElement.style.marginTop = '15px';
        div.appendChild(iconElement);

        const nameElement = document.createElement('p');
        nameElement.classList.add('atlas-label-name');
        nameElement.innerText = location.NAME;
        div.appendChild(nameElement);

        const label = new CSS2DObject(div);

        const pos = new THREE.Vector3(location.COORDINATES.x, location.COORDINATES.y, location.COORDINATES.z);
        const labelPosition = new THREE.Vector3().copy(pos);
        labelPosition.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
        label.position.copy(labelPosition);

        if (location.PARENT.TYPE === 'Planet' || location.PARENT.TYPE === 'Moon') {
            const containerObject = this.scene.getObjectByName(`BODYCONTAINER:${location.PARENT.NAME}`);
            containerObject.add(label);
        } else {
            const system = this.scene.getObjectByName(`SYSTEM:${location.PARENT_STAR.NAME}`);
            system.add(label);
        }

        this.allLabels.push(label);
    }



    #setLabelEvents(domElement, targetObject) {
        console.error('TODO: label events not set')
        return; 

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

    organize(distance, visibility, camera, focusBody) {
        //console.log(focusBody);
        this.#organizeLabels_resetAll();
        this.#organizeLabels_byDistance(distance, visibility);
        this.#organizeLabels_byFocus(focusBody);
        this.#organizeLabels_hideOccluded(camera, focusBody);
    }

    #organizeLabels_resetAll() {
        for (const label of this.allLabels) {
            label.element.dataset.visible = true;
            label.element.dataset.occluded = false;
        }
    }

    #organizeLabels_byDistance(distance, visibility) {
        for (const label of this.allLabels) {
            if (label.element.dataset.objectType === 'Solar System') {
                label.element.dataset.visible = visibility;

            } else if (label.element.dataset.objectType === 'Location') {
                label.element.dataset.visible = (distance < 0.003) ? true : false;
            }
        }
    }

    #organizeLabels_byFocus(focusBody) {
        for (const label of this.allLabels) {
            if (label.element.datset.objectName === 'Hurston') {
                console.log(label.element.dataset.visible);
            }
            if (label.element.dataset.visible === false) continue; 

            if (label.element.dataset.objectType === 'Location') {
                const location = getLocationByName(label.element.dataset.objectName);
                const body = location.PARENT;

                //console.log(location.NAME, body.NAME, (body === focusBody));
                /*if (body.NAME === 'Hurston') {
                    console.log(body, focusBody);
                }*/

                label.element.dataset.visible = (body === focusBody) ? true : false;
            }
        }
    }

    #organizeLabels_hideOccluded(camera, focusBody) {
        const objectMesh = this.scene.getObjectByName(focusBody.NAME);
        const raycaster = new THREE.Raycaster();

        for (const label of this.allLabels) {
            if (label.element.dataset.visible === false) continue;

            const pos = new THREE.Vector3()
            label.getWorldPosition(pos);

            const dir = new THREE.Vector3().copy(pos).sub(camera.position).normalize().negate();

            raycaster.set(pos, dir);
            const intersects = raycaster.intersectObject(objectMesh, false);

            if (intersects.length > 0) {
                label.element.dataset.occluded = true;
            } else {
                label.element.dataset.occluded = false;
            }
        }
    }
}

const LabelManager = new AtlasLabelManager(null);
export default LabelManager;