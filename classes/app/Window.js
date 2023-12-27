export default class Window {
    constructor(elementId, containerId = null, eventToTrigger = null) {
        this.element = document.getElementById(elementId);
        this.container = containerId ? document.getElementById(containerId) : null;
        this.eventToTrigger = eventToTrigger ?? null;

        this.show = false;
    }

    toggle() {
        this.show = !this.show;

        this.element.style.opacity = this.show ? 1 : 0;
        this.element.style.pointerEvents = this.show ? 'auto' : 'none';

        if (this.container) {
            this.container.style.transform = this.show ? 'scale(1)' : 'scale(0)';
        }

        if (this.show && this.eventToTrigger) {
            document.dispatchEvent(new CustomEvent(this.eventToTrigger));
        }
    }
}