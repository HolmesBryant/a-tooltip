export default class ATooltip extends HTMLElement {

	/**
	 * default, modal or inline
	 */
	#position = 'default';

	static observedAttributes = ['position'];

	static tmpl = `
		<style>
			:host {
				--size: 35px;
				--symbol-color: white;
				--bg-color: dodgerblue;
				--accent-color: orange;
				--border-color: silver;
				--width: 400px;
				display: inline-block;
				position: relative;
			}

			button {
				align-items: center;
				background-color: var(--bg-color);
				border: 1px solid var(--border-color);
				border-radius: 50%;
				color: var(--symbol-color);
				cursor: pointer;
				display: flex;
				flex-wrap: wrap;
				font-size: var(--size);
				font-weight: bold;
				height: var(--size);
				justify-content: center;
				line-height: 0;
				outline: none;
				width: var(--size);
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
				width: var(--width);
			}

			dialog > form {
				display: flex;
				justify-content: end;
			}

			dialog > form > button {
				border-bottom-right-radius: 0;
				border-top-left-radius: 0;
				border-top-right-radius: 5px;
			}

			#message {
				overflow-wrap: normal;
				padding: 1rem;
			}
		</style>
		<button id="show" tabindex="0">
			<slot name="symbol">?</slot>
		</button>
		<dialog>
			<form method="dialog">
				<button>×</button>
			</form>
			<div id="message">
				<slot name="message">...</slot>
			</div>
		</dialog>
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
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.showBtn = this.shadowRoot.querySelector('#show');
		this.showBtn.addEventListener('click', () => {
			this.showDialog();
		}, { signal:this.abortController.signal });
	}

	disconnectedCallback() {
		this.abortController.abort();
		this.abortController = null;
	}

	showDialog() {
		switch(this.position) {
		case 'modal':
			this.dialog.showModal();
			break;
		case 'inline':
			this.dialog.style.top = 0;
			this.dialog.style.left = 0;
		default:
			this.dialog.show();
		}
	}

	get position() { return this.#position }
	set position(value) { this.#position = value }

}

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
