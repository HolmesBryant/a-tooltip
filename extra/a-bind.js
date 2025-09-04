export default class ABind extends HTMLElement {
	#o;
	#object;
	#p;
	#property;
	#e;
	#event;
	#a;
	#attribute;

	abortController;
	elem;

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
			const model = await this.getModel(this.object);
			this.addElemListener(model, this.property, this.event, this.attribute, this.elem);
			this.setElemAttr(model, this.property, this.attribute, this.elem);
			window.abind = ABind;
		}
	}

	disconnectedCallback() {
		this.abortController.abort();
		this.abortController = null;
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	static fire(prop, value) {
		const evt = new CustomEvent(
			'abind',
			{ detail: {prop:prop, value:value}}
		);

		document.dispatchEvent(evt);
	}

	addElemListener(object, property, event, attribute, elem) {
		elem.addEventListener(event, () => {
			if (object[property] !== elem[attribute]) {
				object[property] = elem[attribute];
			}
		}, {signal:this.abortController.signal, passive:true});

		document.addEventListener('abind', event => {
			if (this.p !== event.detail.prop) return;
			this.elem[this.attribute] = event.detail.value;
		});
	}

	async getModel(objName, wait = 1) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
	      console.error(`Timeout: ${objName} is not defined or available to window`);
	      resolve(null);
      }, wait * 1000);

      if (window[objName]) {
	      clearTimeout(timeoutId);
      	resolve(window[objName]);
      } else if (customElements.get(objName)) {
	      clearTimeout(timeoutId);
	      resolve(document.querySelector(objName));
      } else {
	      customElements.whenDefined(objName).then(() => {
	        clearTimeout(timeoutId);
	        resolve(document.querySelector(objName));
	      }).catch((error) => {
	        clearTimeout(timeoutId);
	        console.error(error.message);
	        resolve(null);
	      });
      }
    });
	}

	setElemAttr(model, property, attribute, elem) {
		if (model[property] !== elem[attribute]) {
			elem[attribute] = model[property];
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
