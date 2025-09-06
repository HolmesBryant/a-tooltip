export default class ATooltip extends HTMLElement {

	#active = false;

	/**
	 * 'default' or 'click'
	 */
	#activate = 'click';

	/**
	 * 'center', 'inline' or modal'
	 */
	#position = 'modal';

	abortController;

	wrapper;

	dialog;

	showBtn;

	static observedAttributes = ['position', 'activate', 'active'];

	static template = `
		<style>
			:host {
				--accent-color:orange;
				--border-color: silver;
				--message-size: 300px;
				--icon-background: dodgerblue;
				--icon-color: white;
				--icon-size: 35px;
				--pad: .5rem;
				display: inline-block;
				min-height: var(--icon-size);
			}

			button {
				background-color: var(--icon-background);
				border: 1px solid var(--border-color);
				border-radius: 50%;
				box-sizing: border-box;
				color: var(--icon-color);
				cursor: pointer;
				font-size: calc( var(--icon-size) * .98 );
				font-weight: bold;
				height: var(--icon-size);
				line-height: 0;
				outline: none;
				width: var(--icon-size);
			}

			button:focus,
			button:hover {
				background-color: var(--accent-color);
				box-shadow: 1px 1px 2px gray;
			}

			button:active {
				box-shadow: inset 1px 1px 2px gray;
			}

			dialog {
				border: 1px solid var(--border-color);
				border-radius: 5px;
				box-shadow: 2px 2px 5px black;
				padding: 0;
				width: clamp(100px, var(--message-size), 95vw);
			}

			dialog > form {
				display: flex;
				justify-content: space-between;
			}

			dialog > form > button {
				border-bottom-right-radius: 0;
				border-top-left-radius: 0;
				border-top-right-radius: 5px;
			}

			#wrapper.inline {
				position: relative;
			}

			#wrapper.inline.right-edge {
				position: unset;
			}

			#wrapper.inline dialog {
				left: calc(var(--icon-size) + var(--pad));
			}

			#wrapper.inline.right-edge dialog {
				width: unset;
				left: calc(100vw - var(--message-size));
				right: 10px;
			}

			#message {
				font-size: small;
				overflow-wrap: normal;
				padding: var(--pad);
				max-height: var(--message-size);
				overflow: auto;
			}

			#title {
				padding-top: .5rem;
				padding-left: .5rem;
			}

			#title ::slotted(*) {
				margin: 0;
			}

			#wrapper {
				width: stretch;
			}

		</style>


		<div id="wrapper">

			<dialog>
				<form method="dialog">
					<div id="title">
						<slot name="title"></slot>
					</div>
					<button>×</button>
				</form>
				<div id="message">
					<slot name="message">...</slot>
				</div>
			</dialog>

			<button id="show" tabindex="0">
				<slot name="symbol">?</slot>
			</button>
		</div>
	`;

	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = ATooltip.template;
	}

	attributeChangedCallback(attr, oldval, newval) {
		// Convert kebab-case attribute name to camelCase property name
    attr = attr.replace(/-(.)/g, (match, letter) => letter.toUpperCase());
    this[attr] = newval;
	}

	connectedCallback() {
		this.abortController = new AbortController();
		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.showBtn = this.shadowRoot.querySelector('#show');
		// this.setCssProperties();
		this.addListeners();
		if (this.active) this.showDialog();
	}

	disconnectedCallback() {
		this.abortController.abort();
		this.abortController = null;
	}

	/**
	 * Check out the popover api
	 */
	addListeners() {
		switch (this.activate) {
		case 'click':
			this.showBtn.addEventListener('click', () => {
				this.showDialog();
			}, { signal:this.abortController.signal });
			break;
		default:
			this.showBtn.addEventListener('click', () => {
				this.showDialog();
			}, { signal:this.abortController.signal });
			this.showBtn.addEventListener('mouseenter', () => {
				this.showDialog();
			}, { signal:this.abortController.signal });
			this.showBtn.addEventListener('mouseleave', () => {
				this.hideDialog();
			}, { signal:this.abortController.signal });
		}

		this.dialog.addEventListener('close', () => {
			this.toggleAttribute('active', false);
		}, {signal:this.abortController.signal, passive:true});
	}

	hideDialog() {
		if (this.active === false) return;
		this.dialog.close();
	}

	/*setCssProperties() {
		const props = [
			"accentColor",
			"borderColor",
			"messageSize",
			"iconBackground",
			"iconColor",
			"iconSize",
			"pad",
		];

		for (const prop of props) {
			const cssProp = '--' + prop.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
			const elemStyles = getComputedStyle(this);
			const exists = elemStyles.getPropertyValue(cssProp);
			if (!exists) this.style.setProperty(`${cssProp}`, this[prop]);
			if (exists) this[prop] = exists;
		}
	}*/

	showDialog() {
		if (this.active === true) return;
		if (this.wrapper) {
			this.wrapper.classList.remove('inline');
			this.wrapper.classList.remove('right-edge');
		}
		switch(this.position) {
		case 'modal':
			this.dialog.showModal();
			break;
		case 'inline':
			if (!this.wrapper) {
				// if showDialog was called from a setter
				customElements.whenDefined('a-tooltip')
				.then(() => this.showDialog());
			} else {
				const rect = this.wrapper.getBoundingClientRect();
				const distanceToRight = window.innerWidth - (rect.right + window.pageXOffset) - 20;
				const computedStyles = window.getComputedStyle(this.wrapper);
				const messageSize = computedStyles.getPropertyValue('--message-size').trim();
				this.wrapper.classList.add('inline');
				if (distanceToRight < parseFloat(messageSize)) {
					this.wrapper.classList.add('right-edge');
				}
				this.dialog.show();
			}
			break;
		default:
			this.dialog.show();
		}

		this.toggleAttribute('active', true);
	}

	get active() { return this.#active }
	set active(value) {
		value = !(value === 'false' || value === false || value === null);
		if (this.#active !== value) {
			abind.fire('active', value);
			this.#active = value;
			if (!this.#active) {
				this.hideDialog();
			} else {
				this.showDialog();
			}
		}
	}

	get activate() { return this.#activate }
	set activate(value) {
		if (this.#activate !== value) {
			abind.fire('activate', value);
			this.#activate = value;
			this.abortController.abort();
			this.abortController = new AbortController();
			this.addListeners();
		}
	}

	get position() { return this.#position }
	set position(value) {
		if (this.#position !== value) {
			this.#position = value;
		}
		abind.fire('position', value);
	}

	/*get accentColor () { return this.#accentColor }
	set accentColor(value) {
		this.#accentColor = value;
		// abind.fire('accentColor', value);
	}*/

	/*get borderColor() { return this.#borderColor }
	set borderColor(value) {
		this.#borderColor = value;
		// abind.fire('borderColor', value);
	}*/

	/*get messageSize() { return this.#messageSize }
	set messageSize(value) {
		this.#messageSize = value;
		// abind.fire('messageSize', value);
	}*/

	/*get pad () { return this.#pad }
	set pad(value) {
		this.#pad = value;
		// abind.fire('pad', value);
	}*/

	/*get iconBackground() { return this.#iconBackground }
	set iconBackground(value) {
		this.#iconBackground = value;
		// abind.fire('iconBackground', value);
	}*/

	/*get iconColor() { return this.#iconColor }
	set iconColor(value) {
		this.#iconColor = value;
		abind.fire('iconColor', value);
	}*/

	/*get iconSize() { return this.#iconSize }
	set iconSize(value) {
		this.#iconSize = value;
		// abind.fire('iconSize', value);
	}*/
} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
