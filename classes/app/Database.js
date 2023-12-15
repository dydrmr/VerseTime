import { getSystemByName, getBodyByName } from '../../HelperFunctions.js';
import SolarSystem from '../SolarSystem.js';
import Star from '../Star.js';
import CelestialBody from '../CelestialBody.js';
import Location from '../Location.js';
import Wormhole from '../Wormhole.js';

class Database {
    constructor() {
        if (Database.instance) return Database.instance;
        Database.instance = this;

        this.systems = Array();
        this.stars = Array();
        this.bodies = Array();
        this.locations = Array();
        this.wormholes = Array();
    }

    async createDatabase() {
        await Database.createSolarSystems();
        await Database.createStars();
        await Database.createCelestialBodies();
        await Database.createLocations();
        await Database.createWormholes();
    }

    static async fetchCSV(url) {
        let csvString = null;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching CSV!\nURL: ${url}\nSTATUS: ${response.status}`);
            }
            csvString = await response.text();

        } catch (error) {
            throw new Error(`Error fetching CSV:\n${error}`);
        }

        const data = Database.#parseCSV(csvString);
        return data;

    }

    static #parseCSV(csvString) {
        const lines = csvString.split("\n");
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            const obj = {};

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j];
            }

            data.push(obj);
        }

        return data;
    }

    static async createSolarSystems() {
        const systems = await Database.fetchCSV('data/systems.csv');
        for (const sys of systems) { Database.#createSolarSystem(sys); }
    }

    static #createSolarSystem(data) {
        if (data.coordinateX === '') return;

        let system = new SolarSystem(
            String(data.name),
            parseFloat(data.coordinateX),
            parseFloat(data.coordinateY),
            parseFloat(data.coordinateZ),
            String(data.affiliation)
        )
    }

    static async createStars() {
        const stars = await Database.fetchCSV('data/stars.csv');
        for (const star of stars) { Database.#createStar(star); }
    }

    static #createStar(data) {
        if (data.system === '') return;

        let parentSystem = getSystemByName(String(data.system));
        let radius = parseFloat(data.radius);

        let star = new Star(
            String(data.name),
            parentSystem,
            parseFloat(data.coordinateX),
            parseFloat(data.coordinateY),
            parseFloat(data.coordinateZ),
            radius

        );
    }

    static async createCelestialBodies() {
        const bodies = await Database.fetchCSV('data/bodies.csv');
        for (const body of bodies) { Database.#createCelestialBody(body); }

        // NATURAL SATELLITES
        for (const body of DB.bodies) {
            const children = DB.bodies.filter((otherBody) => {
                if (!otherBody.PARENT) return false;

                if (
                    otherBody.PARENT.NAME === body.NAME &&
                    (otherBody.TYPE === 'Planet' || otherBody.TYPE === 'Moon')
                ) {
                    return true;
                }
            });
            body.NATURAL_SATELLITES = children;
        }
    }

    static #createCelestialBody(data) {
        if (data.bodyRadius === '') return;

        let parentBody = (data.parentBody === '') ? null : getBodyByName(data.parentBody);
        let parentStar = (data.parentStar === '') ? null : getBodyByName(data.parentStar);

        let themeImage = null;
        if (data.type === 'Lagrange Point') {
            themeImage = getBodyByName(data.parentBody).THEME_IMAGE;
        } else if (data.themeImage !== '') {
            themeImage = String(data.themeImage);
        }

        let themeColor = { 'r': 0, 'g': 0, 'b': 0 };
        if (data.type === 'Lagrange Point') {
            themeColor = getBodyByName(data.parentBody).THEME_COLOR;
        } else if (data.themeColorR !== '') {
            themeColor = {
                'r': parseInt(data.themeColorR),
                'g': parseInt(data.themeColorG),
                'b': parseInt(data.themeColorB)
            }
        }
        
        let body = new CelestialBody(
            String(data.name),
            String(data.type),
            parentBody,
            parentStar,
            {
                'x': parseFloat(data.coordinateX),
                'y': parseFloat(data.coordinateY),
                'z': parseFloat(data.coordinateZ)
            },
            {
                'w': parseFloat(data.quaternionW),
                'x': parseFloat(data.quaternionX),
                'y': parseFloat(data.quaternionY),
                'z': parseFloat(data.quaternionZ)
            },
            parseFloat(data.bodyRadius),
            parseFloat(data.rotationRate),
            parseFloat(data.rotationCorrection),
            parseFloat(data.orbitAngle),
            parseFloat(data.orbitRadius),
            themeColor,
            themeImage
        );

        if (data.ringRadiusInner !== '') {
            body.RING = {
                'radius-inner': parseFloat(data.ringRadiusInner),
                'radius-outer': parseFloat(data.ringRadiusOuter)
            }
        }

        if (data.ordinal !== '') {
            body.ORDINAL = data.ordinal;
        } else if (data.type = 'Lagrange Point') {
            body.ORDINAL = '99';
        } else {
            body.ORDINAL = '0';
        }
    }

    static async createLocations() {
        const locations = await Database.fetchCSV('data/locations.csv');
        for (const loc of locations) { Database.createLocation(loc); }
    }

    static createLocation(data) {
        if (data.parentbody === '' && data.parentStar === '') return;
        if (data.coordinateX === '' && data.coordinateY === '' && data.coordinateZ === '') return;

        let parentBody = (data.parentBody === 'null') ? null : getBodyByName(data.parentBody);
        let parentStar = (data.parentStar === 'null') ? null : getBodyByName(data.parentStar);
        let themeImage = (data.themeImage === 'null') ? null : String(data.themeImage);

        let location = new Location(
            String(data.name),
            String(data.type),
            parentBody,
            parentStar,
            {
                'x': parseFloat(data.coordinateX),
                'y': parseFloat(data.coordinateY),
                'z': parseFloat(data.coordinateZ)
            },
            null,
            themeImage
        );
    }

    static async createWormholes() {
        const wormholes = await Database.fetchCSV('data/wormholes.csv');
        for (const wh of wormholes) { Database.createWormhole(wh); }
    }

    static createWormhole(data) {
        let x1 = data.position1x === '' ? null : parseFloat(data.position1x);
        let y1 = data.position1y === '' ? null : parseFloat(data.position1y);
        let z1 = data.position1z === '' ? null : parseFloat(data.position1z);
        let x2 = data.position1x === '' ? null : parseFloat(data.position2x);
        let y2 = data.position1y === '' ? null : parseFloat(data.position2y);
        let z2 = data.position1z === '' ? null : parseFloat(data.position2z);

        let wormhole = new Wormhole(
            String(data.size),
            getSystemByName(String(data.system1)),
            getSystemByName(String(data.system2)),
            x1, y1, z1,
            x2, y2, z2
        )
    }

}

const DB = new Database();
export default DB;