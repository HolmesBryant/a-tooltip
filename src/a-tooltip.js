export default class ATooltip extends HTMLElement {

	#active = false;

	/**
	 * 'default' or 'click'
	 */
	#activate = 'click';

	/**
	 * 'center', 'inline' or modal'
	 */
	#position = 'inline';

	abortController;

	wrapper;

	dialog;

	showBtn;

	static observedAttributes = ['position', 'activate', 'active'];

	static template = `
		<style>
			:host {
				--symbol-size: 35px;
				--symbol-color: white;
				--symbol-background: dodgerblue;
				--accent-color: orange;
				--border-color: silver;
				--message-size: 300px;
				--pad: .5rem;
				display: inline-block;
				min-height: var(--symbol-size);
			}

			button {
				background-color: var(--symbol-background);
				border: 1px solid var(--border-color);
				border-radius: 50%;
				box-sizing: border-box;
				color: var(--symbol-color);
				cursor: pointer;
				font-size: calc( var(--symbol-size) * .98 );
				font-weight: bold;
				height: var(--symbol-size);
				line-height: 0;
				outline: none;
				width: var(--symbol-size);
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
				left: calc(var(--symbol-size) + var(--pad));
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
		this[attr] = newval;
	}

	connectedCallback() {
		this.abortController = new AbortController();
		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.showBtn = this.shadowRoot.querySelector('#show');
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
} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
