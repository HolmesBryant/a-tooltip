export default class ABind extends HTMLElement {
	#o;
	#object;
	#p;
	#property;
	#e;
	#event = 'input';
	#a;
	#attribute = 'value';

	abortController;
	elem;
	model;

	static observedAttributes = [
		'o',
		'object',
		'p',
		'property',
		'e',
		'event',
		'a',
		'attribute'
	];

	constructor() {
		super();
	}

	async connectedCallback() {
		if (this.object) {
			this.abortController = new AbortController();
			this.elem = this.children[0];
			if (!this.elem) {
				console.error('a-bind must have one child which is an HTML element', this);
				return;
			}
			this.model = await this.getModel(this.object);

			if (!this.model) {
				console.error(this);
				throw new Error(`The object described by ${this.object} is ${model}`);
			}

			this.addElemListener(this.model, this.property, this.event, this.attribute, this.elem);
			this.setElemAttr(this.model, this.property, this.attribute, this.elem);
			window.abind = ABind;
			// console.log(this.property)
		}
	}

	disconnectedCallback() {
		this.abortController.abort();
		this.abortController = null;
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	static fire(obj, prop, value) {
		const evt = new CustomEvent(
			'abind',
			{ detail: {obj:obj, prop:prop, value:value}}
		);

		document.dispatchEvent(evt);
	}

	addElemListener(object, property, event, attribute, elem) {
		if (!property in object && !property.startsWith('--')) {
			return console.error(`${Object.prototype.toString.call(object)} does not have property ${property}`);
		}

		elem.addEventListener(event, (event) => {
			if (this.property.startsWith('--')) {
				// this.property is likely a css variable (custom property)
				if (elem[attribute] === "" || elem[attribute] === "#000000") {
					// when you reset a <input type="color"> or set its value to "",
					// the browser sets the value to #000000.
					this.model.style.removeProperty(property);
					const styles = getComputedStyle(this.model);
					const propValue = styles.getPropertyValue(this.property);
					if (elem.type === "color") {
						elem[attribute] = this.convertColor(propValue);
					} else {
						elem[attribute] = propValue;
					}
				} else {
					this.model.style.setProperty(property, elem[attribute]);
				}
			} else {
				if (object[property] !== elem[attribute]) {
					object[property] = elem[attribute];
				}
			}

		}, {signal:this.abortController.signal, bubbles:true});

		document.addEventListener('abind', event => {
			if (this.model !== event.detail.obj) return;
			if (this.property !== event.detail.prop) return;
			this.elem[this.attribute] = event.detail.value;
		}, { passive: true });
	}

	async getModel(objName, wait = 1) {
		let name, id = '';
		if (objName.startsWith('#')) {
			const [n, selector] = objName.split('#');
			name = n;
			id = `#${selector}`;
		} else {
			name = objName;
		}

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
	      console.error(`Timeout: ${objName} is not defined or available to window`);
	      resolve(null);
      }, wait * 1000);

      if (window[name]) {
	      clearTimeout(timeoutId);
      	resolve(window[name]);
      } else if (customElements.get(name)) {
	      clearTimeout(timeoutId);
	      resolve(document.querySelector(name + id));
	    } else if (id) {
	    	clearTimeout(timeoutId);
	    	resolve(document.querySelector(id));
      } else {
	      customElements.whenDefined(name).then(() => {
	        clearTimeout(timeoutId);
	        resolve(document.querySelector(name + id));
	      }).catch((error) => {
	        clearTimeout(timeoutId);
	        console.error(`${error.message} : ${name} ${id}`);
	        resolve(null);
	      });
      }
    });
	}

	convertColor(value) {
		if (value === null || value === undefined) return console.error(`The color value for ${this.property} on ${this.object} is ${value}`);
		// convertColorValueToHex() is a function in "a-bind-color-conversion.js" script file.
		// Remember to include the script in your page if you are using <input type="color">
		return convertColorValueToHex ? convertColorValueToHex(value) : value;
	}

	setElemAttr(obj, property, attribute, elem) {
		let value;
		if (property.startsWith('--') && obj instanceof HTMLElement) {
			// its a css custom property;
			const styles = getComputedStyle(obj);
			value = styles.getPropertyValue(property);
		} else {
			value = obj[property];
		}

		const modelName = (obj instanceof HTMLElement) ? obj.localName : Object.prototype.toString.call(obj);
		if (value === null || value === undefined) {
			return console.error(`${property} is not a property of ${modelName}`, elem);
		}

		if (value !== elem[attribute]) {
			switch (elem.type) {
				case "color":
					value = this.convertColor(value);
				default:
					elem[attribute] = value;
			}
		}
	}

	get o() { return this.#object }
	set o(value) { this.#object = value }

	get object() { return this.#object }
	set object(value) { this.#object = value }

	get p() { return this.#property }
	set p(value) { this.#property = value }

	get property() { return this.#property }
	set property(value) { this.#property = value }

	get e() { return this.#event }
	set e(value) { this.#event = value }

	get event() { return this.#event }
	set event(value) { this.#event = value }

	get a() { return this.#attribute }
	set a(value) { this.#attribute = value }

	get attribute() { return this.#attribute }
	set attribute(value) { this.#attribute = value }
}

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-bind')) customElements.define('a-bind', ABind);
}, {once:true, passive:true});
