let showAtlasWindow = false;
let showMapWindow = false;

class UserInterface {
    constructor() {
        if (UserInterface.instance) return UserInterface.instance;
		UserInterface.instance = this;
		this.setupEventListeners();
	}

	setupEventListeners() {
		// CLICKS
		this.el('BUTTON-toggle-atlas-window').addEventListener('click', () => this.toggleAtlasWindow());

		this.el('BUTTON-toggle-map-window').addEventListener('click', () => this.toggleMapWindow());
		this.el('BUTTON-close-map').addEventListener('click', () => this.toggleMapWindow());

		// KEYBOARD
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') {
				//if (showSettingsWindow) toggleSettingsWindow();
				//if (showCreditsWindow) toggleCreditsWindow();
				if (UI.showAtlasWindow) UI.toggleAtlasWindow();
				if (UI.showMapWindow) UI.toggleMapWindow();
				//if (window.DEBUG_MODE) toggleDebugWindow();
			}

			if (event.target.tagName.toLowerCase() === 'input') return;


			if (event.key === 'a') { UI.toggleAtlasWindow(); }
			if (event.key === 'm') { UI.toggleMapWindow(); }

			//if (event.keyCode === 68) { toggleDebugWindow(); }

			//if (event.keyCode === 84) {
			//	window.SETTING_24HR = !window.SETTING_24HR;
			//	saveSetting('time24', window.SETTING_24HR);
			//}

			//if (event.keyCode === 191) {
			//	toggleSettingsWindow('on');
			//	document.getElementById('location-selection-input').blur();
			//}
		});
	}

	setText(elementID, string) {
		let el = (typeof elementID === 'string') ? document.getElementById(elementID) : elementID;

		if (!el) {
			console.error('Element not found:', elementID);
			return null;
		}

		if (el.textContent !== string) el.textContent = string;
	}

	el(idString) {
		let el = document.getElementById(idString);

		if (!el) {
			console.error('Element not found:', idString);
			return null;
		}

		return el;
	}

	toggleAtlasWindow() {
		UI.showAtlasWindow = !UI.showAtlasWindow;

		if (UI.showAtlasWindow) {
			document.dispatchEvent(new CustomEvent('createAtlasScene'));
		}

		const atlasModal = UI.el('modal-atlas');
		const atlasContainer = UI.el('atlas-container');

		atlasModal.style.opacity = UI.showAtlasWindow ? 1 : 0;
		atlasModal.style.pointerEvents = (UI.showAtlasWindow ? 'auto' : 'none');
		atlasContainer.style.transform = (UI.showAtlasWindow ? 'scale(1)' : 'scale(0)');
	}

	toggleMapWindow() {
		UI.showMapWindow = !UI.showMapWindow;

		if (UI.showMapWindow) {
			document.dispatchEvent(new CustomEvent('createMapScene'));
		}

		const mapModal = UI.el('modal-map');
		const mapContainer = UI.el('map-window');

		mapModal.style.opacity = (UI.showMapWindow ? 1 : 0);
		mapModal.style.pointerEvents = (UI.showMapWindow ? 'auto' : 'none');
		mapContainer.style.transform = (UI.showMapWindow ? 'scale(1)' : 'scale(0)');
	}

}

const UI = new UserInterface();
export default UI;