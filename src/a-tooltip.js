export default class ATooltip extends HTMLElement {

	#active = true;

	/**
	 * 'default' or 'click'
	 */
	#activate = 'default';

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
				--message-width: 400px;
				display: inline;
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
				display: fixed;
				position:relative;
				border: 1px solid purple;
			}

			.inline dialog {

				top: 0;
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
				border: 1px solid lime;
			}

		</style>

			<button id="show" tabindex="0">
				<slot name="symbol">?</slot>
			</button>

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

		</div>
	`;

	constructor() {
		super();
		this.attachShadow({mode:'open'});
		// this.shadowRoot.innerHTML = ATooltip.tmpl;
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	connectedCallback() {
		this.setTemplate();
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
	}

	hideDialog() {
		this.dialog.close();
	}

	setTemplate() {
		let content = '';
		const titleSlot = this.querySelector('[slot="title"]');
		const messageSlot = this.querySelector('[slot="message"]');
		if (titleSlot) content += titleSlot.textContent;
		if (messageSlot) content += messageSlot.textContent;
		const template = ATooltip.template.replace('{content}', `${content}`);
		// console.log(template);
		// return;
		this.shadowRoot.innerHTML = template;
		// const template = document.createRange().createContextualFragment(ATooltip.template);
		// this.shadowRoot.append(template);
		console.log(content, template.textContent);
	}

	showDialog() {
		switch(this.position) {
		case 'modal':
			this.dialog.showModal();
			break;
		case 'inline':
			this.wrapper.classList.add('inline');
		default:
			this.dialog.show();
		}
	}

	get active() { return this.#active }
	set active(value) {
		value = !(value === 'false' || value === false);
		if (this.#active !== value) {
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
	}

}

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
