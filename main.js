import Settings from './classes/app/Preferences.js';
import DB from './classes/app/Database.js';
import UI from './classes/app/UserInterface.js';

window.suppressReload = false;

function update() {
	if (DB.locations.length === 0) return;
	UI.update();
}


// INIT
async function startVerseTime() {
	await DB.createDatabase();
	DB.locations.sort((a, b) => a.NAME.localeCompare(b.NAME));
	UI.populateLocationList();

	checkHash();
	Settings.load();

	setInterval(update, 250);
	update();
}
startVerseTime();

function checkHash() {
	const hash = window.location.hash;
	if (hash === '') return;

	const hashParts = hash.replace('#', '').replaceAll('_', ' ').split('@');
	const locationName = hashParts[0];

	if (hashParts[1] !== undefined) {
		UI.setCustomTime(hashParts[1], true);
	}

	UI.setMapLocation(locationName);
}

window.addEventListener('hashchange', () => {
	if (window.suppressReload) return;
	window.location.reload(true);
}, false);