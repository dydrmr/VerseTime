import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer';

import { getLocationByName, getBodyByName, getSystemByName } from '../../HelperFunctions.js';
import { setFocus } from '../../atlas.js';
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
        div.dataset.objectType = body.TYPE;
        div.dataset.systemName = body.TYPE === 'Star' ? body.NAME : body.PARENT_STAR.NAME;
        div.dataset.parentName = body.TYPE === 'Star' ? null : body.PARENT.NAME;
        div.dataset.objectName = body.NAME;
        div.dataset.visible = false;

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
        this.allLabels.push(label);
    }

    #createLabel_Location(location) {
        const div = document.createElement('div');
        div.classList.add('atlas-label');
        div.dataset.objectType = 'Location';
        div.dataset.objectName = location.NAME;
        div.dataset.systemName = location.PARENT_STAR.NAME;
        div.dataset.bodyName = location.PARENT.NAME;
        div.dataset.visible = false;

       this.#setLabelEvents(div, location);

        const iconElement = document.createElement('div');
        this.#setBodyIcon(location.TYPE, iconElement);
        iconElement.style.marginTop = '15px';
        div.appendChild(iconElement);

        const nameElement = document.createElement('p');
        nameElement.classList.add('atlas-label-name');
        nameElement.innerText = location.NAME;
        div.appendChild(nameElement);

        const label = new CSS2DObject(div);
        let labelPosition;
        if (Number.isFinite(location.COORDINATES_3DMAP.x)) {
            labelPosition = new THREE.Vector3(
                location.COORDINATES_3DMAP.x * -1 * location.PARENT.BODY_RADIUS,
                location.COORDINATES_3DMAP.y * location.PARENT.BODY_RADIUS,
                location.COORDINATES_3DMAP.z * location.PARENT.BODY_RADIUS
            );
            labelPosition.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
        } else {
            labelPosition = new THREE.Vector3(
                location.COORDINATES.x,
                location.COORDINATES.y,
                location.COORDINATES.z
            )
        }
        label.position.copy(labelPosition);

        label.userData.parentType = location.PARENT.TYPE;

        if (
            location.PARENT.TYPE === 'Planet' ||
            location.PARENT.TYPE === 'Moon' ||
            location.PARENT.TYPE === 'Lagrange Point' ||
            location.PARENT.TYPE === 'Jump Point'
        ) {
            const containerObject = this.scene.getObjectByName(`BODYCONTAINER:${location.PARENT.NAME}`);
            containerObject.add(label);
        } else {
            const system = this.scene.getObjectByName(`SYSTEM:${location.PARENT_STAR.NAME}`);
            system.add(label);
        }

        this.allLabels.push(label);
    }

    #setBodyIcon(type, element) {
        element.classList.add('mapLocationIcon');
        element.classList.add('atlas-label-icon');

        if (type === 'Star') {
            element.classList.add('icon-star');

        } else if (type === 'Planet' || type === 'Moon') {
            element.classList.add('icon-planet');

        } else if (type === 'Jump Point') {
            element.classList.add('icon-wormhole');

            /*	} else if (
                    type === 'Underground bunker' ||
                    type === 'Emergency shelter' ||
                    type === 'Outpost' ||
                    type === 'Prison' ||
                    type === 'Shipwreck' ||
                    type === 'Scrapyard' ||
                    type === 'Settlement'
                ) {
                    element.classList.add('icon-outpost');
            
                } else if (
                    type === 'Space station' ||
                    type === 'Asteroid base'
                ) {
                    element.classList.add('icon-spacestation');
            
                } else if (type === 'Landing zone') {
                    element.classList.add('icon-landingzone');*/

        } else {
            element.classList.add('icon-space');
        }
    }

    #setLabelEvents(domElement, targetObject) {
        domElement.addEventListener('pointerdown', (event) => {
            if (event.button === 0) {
                setFocus(targetObject);
            }
        });

        console.warn('TODO: bind label infobox events');
        return; 

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
        this.#organizeLabels_resetAll();
        this.#organizeLabels_byFocus(focusBody);
        this.#organizeLabels_byDistance(distance, visibility);
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
            if (label.element.dataset.visible === 'false') continue; 

            const type = label.element.dataset.objectType;
            
            if (type === 'Solar System') {
                label.element.dataset.visible = visibility;

            } else if (
                type === 'Star' ||
                type === 'Planet'
            ) {
                if (visibility) {
                    label.element.dataset.visible = false;
                }

                if (distance < 0.003) {
                    label.element.dataset.visible = false;
                }

            } else if (type === 'Lagrange Point' || type === 'Jump Point') {
                if (distance > 8 || distance < 0.025) {
                    label.element.dataset.visible = false;
                }

            } else if (type === 'Moon') {
                if (distance > 0.25 || distance < 0.003) {
                    label.element.dataset.visible = false;
                }

            } else if (type === 'Location') {
                let triggerDistance = 0.003;

                if (label.userData.parentType === 'Lagrange Point' || label.userData.parentType === 'Jump Point') {
                    triggerDistance = 0.025;
                }

                if (distance > triggerDistance) {
                    label.element.dataset.visible = false;
                }
            }
        }
    }

    #organizeLabels_byFocus(focusBody) {
        let focusSystemName;
        if (focusBody instanceof Star) {
            focusSystemName = focusBody.NAME;
        } else {
            focusSystemName = focusBody.PARENT_STAR.NAME;
        }

        for (const label of this.allLabels) {
            if (label.element.dataset.visible === 'false') continue;

            const type = label.element.dataset.objectType;
            const systemName = label.element.dataset.systemName;

            if (type === 'Solar System') {
                continue;

            } else if (type === 'Moon') {
                const body = getBodyByName(label.element.textContent);
                const parent = body.PARENT;

                if (
                    focusBody.NAME !== body.NAME &&
                    focusBody.NAME !== parent.NAME &&
                    focusBody.PARENT?.NAME !== parent.NAME
                ) {
                    label.element.dataset.visible = false;
                }

            } else if (type === 'Location') {

                if (focusSystemName !== systemName) {
                    label.element.dataset.visible = false;
                    continue;
                }

                if (label.element.dataset.bodyName !== focusBody.NAME) {
                    label.element.dataset.visible = false;
                }

            } else {
                if (focusSystemName !== systemName) {
                    label.element.dataset.visible = false;
                }
            }
        }
    }

    #organizeLabels_hideOccluded(camera, focusBody) {
        const objectMesh = this.scene.getObjectByName(focusBody.NAME);
        const raycaster = new THREE.Raycaster();

        for (const label of this.allLabels) {
            if (label.element.dataset.visible === 'false') continue;

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