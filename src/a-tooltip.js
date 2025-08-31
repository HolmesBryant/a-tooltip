export default class ATooltip extends HTMLElement {

	#active = false;

	/**
	 * 'default' or 'click'
	 */
	#activate = 'default';

	/**
	 * 'center', 'inline' or modal'
	 */
	#position = 'inline';


	static observedAttributes = ['position', 'activate', 'active'];

	static tmpl = `
		<style>
			:host {
				--symbol-size: 35px;
				--symbol-color: white;
				--symbol-background: dodgerblue;
				--accent-color: orange;
				--border-color: silver;
				--message-width: 400px;
			}

			button {
				align-items: center;
				background-color: var(--symbol-background);
				border: 1px solid var(--border-color);
				border-radius: 50%;
				color: var(--symbol-color);
				cursor: pointer;
				display: inline-flex;
				flex-wrap: wrap;
				font-size: var(--symbol-size);
				font-weight: bold;
				height: var(--symbol-size);
				justify-content: center;
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

			.inline {
				position: relative;
			}

			.inline dialog {
				position: absolute;
				left: var(--symbol-size);
				width: clamp(50px, 50vw, 400px);
			}

			#message {
				overflow-wrap: normal;
				padding: 1rem;
				max-width: var(--message-width);
			}

			#title {
				padding-top: .5rem;
				padding-left: .5rem;
			}

			#title ::slotted(*) {
				margin: 0;
			}

			#wrapper {
				display: inline-grid;
			}
		</style>
		<div id="wrapper">

			<button id="show" tabindex="0">
				<slot name="symbol">?</slot>
			</button>

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

		</div>
	`;

	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = ATooltip.tmpl;
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
		if (this.active) {
			this.showDialog();
		}
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
	}

	hideDialog() {
		this.dialog.close();
	}

	showDialog() {
		switch(this.position) {
		case 'modal':
			this.dialog.showModal();
			break;
		case 'inline':
			// this.dialog.style.top = 0;
			this.wrapper.classList.add('inline');
			// this.dialog.style.left = 0;
			// this.dialog.style.right = 0;
		default:
			this.dialog.show();
			// this.showBtn.style.display = 'flex';
		}
	}

	get active() { return this.#active }
	set active(value) {
		this.#active = !(value === 'false' || value === false);
		if (!this.active) this.hideDialog();
	}

	get activate() { return this.#activate }
	set activate(value) { this.#activate = value }

	get position() { return this.#position }
	set position(value) { this.#position = value }

}

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
