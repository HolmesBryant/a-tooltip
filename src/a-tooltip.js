/**
 * ATooltip class that extends HTMLElement to create a tooltip component.
 *
 * @class ATooltip
 * @extends {HTMLElement}
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */
export default class ATooltip extends HTMLElement {

	/**
	 * Whether the tooltip dialog is open (true) or closed (false)
	 *
	 * @private
	 * @type {boolean}
	 */
	#active = false;

	/**
	 *Tooltip position, can be 'center', 'inline' or 'modal'.
   *
   * @private
   * @type {string}
   */
	#position = 'inline';

	/**
	 * AbortController for removing event listeners when element is removed from the DOM
	 *
	 * @type {AbortController}
	 */
	abortController;

	/**
	 * An html element which wraps the "open" button and the dialog
	 *
	 * @type {HTMLElement}
	 */
	wrapper;

	/**
	 * The HTML dialog element in which the tooltip message is displayed.
	 *
	 * @type {HTMLDialogElement}
	 */
	dialog;

	/**
	 * The HTML button element in the dialog which closes the dialog.
	 *
	 * @type {HTMLButtonElement}
	 */
	closeBtn;

	/**
	 * The HTML button element which is clicked to show the tooltip message.
	 *
	 * @type {HTMLButtonElement}
	 */
	showBtn;

	/**
	 * List of observed attributes.
	 *
	 * @static
	 * @type {Array<string>}
	 */
	static observedAttributes = ['position', 'activate', 'active'];

	/**
   * Template containing styles and HTML structure for the tooltip component.
   *
   * @static
   * @type {string}
   */
	static template = `
		<style>
			:host {
				--accent-color:orange;
				--border-color: silver;
				--border-radius: 50%;
				--cursor: pointer;
				--message-size: 300px;
				--icon-background: dodgerblue;
				--icon-color: white;
				--icon-size: 35px;
				--pad: .5rem;
				display: inline-block;
				min-height: var(--icon-size);
			}

			@keyframes fadeIn {
			  from { opacity: 0; }
			  to { opacity: 1; }
			}

			button {
				background: var(--icon-background);
				border: 1px solid var(--border-color);
				border-radius: var(--border-radius);
				box-sizing: border-box;
				color: var(--icon-color);
				font-weight: bold;
				line-height: 0;
				outline: none;
				overflow: clip;
			}

			button#show {
				cursor: var(--cursor);
				font-size: calc( var(--icon-size) * .99 );
				height: var(--icon-size);
				width: var(--icon-size);
			}

			button#close {
				cursor: pointer;
				font-size: 34px;
				height: 35px;
				width: 35px;
			}

			button:focus,
			button:hover {
				background-color: var(--accent-color);
				box-shadow: 1px 1px 2px gray;
			}

			button:active
			{ box-shadow: inset 1px 1px 2px gray; }

			dialog {
				border: 1px solid var(--border-color);
				border-radius: 5px;
				box-shadow: 2px 2px 5px black;
				padding: 0;
			}

			dialog[open],
			dialog[open]::backdrop
			 { animation: fadeIn .25s ease-in-out; }

			dialog::backdrop {
				background: rgba(0,0,0,0.5);
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

			::slotted(h1),
			::slotted(h2),
			::slotted(h3),
			::slotted(h4),
			::slotted(h5),
			::slotted(h6)
			{ margin: 0}


			::slotted(img) {
				width: 100%;
				object-fit: cover;
			}

			::slotted(svg) {
				fill: var(--icon-color);
				width: 100%;
			}

			#message {
				font-size: small;
				overflow-wrap: normal;
				padding: var(--pad);
				width: max-content;
				max-height: var(--message-size);
				max-width: var(--message-size);
			}

			#title {
				padding-top: .5rem;
				padding-left: .5rem;
			}

			#title ::slotted(*) {
				margin: 0;
			}

			#wrapper { width: stretch; }
			#wrapper.inline { position: relative; }
			#wrapper.inline.right-edge { position: unset; }
			#wrapper.inline dialog { left: calc(var(--icon-size) + var(--pad)); }
			#wrapper.inline.right-edge dialog {
				width: unset;
				left: calc(100vw - var(--message-size));
				right: 10px;
			}
		</style>

		<div id="wrapper">
			<dialog part="dialog">
				<form method="dialog">
					<div id="title" part="title">
						<slot name="title"></slot>
					</div>
					<button id="close" part="close">×</button>
				</form>
				<div id="message" part="message">
					<slot>...</slot>
				</div>
			</dialog>

			<button id="show" tabindex="0" part="icon">
				<slot name="icon">?</slot>
			</button>
		</div>
	`;

	/**
	 * Creates an instance of ATooltip
	 *
	 * @test mock
	 		const elem = document.createElement('a-tooltip');
	 		elem.id = 'test-elem';
	 		document.body.append(elem);
	 		a.mod = document.querySelector(`#${elem.id}`);
	 		//console.log(a.mod) \\
	 */
	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = ATooltip.template;
	}

	/**
   * Called when an attribute is changed, added, or removed.
   *
   * @param {string} attr - The name of the attribute.
   * @param {any} oldval - The old value of the attribute.
   * @param {any} newval - The new value of the attribute.
   */
	attributeChangedCallback(attr, oldval, newval) {
		// Convert kebab-case attribute name to camelCase property name
    attr = attr.replace(/-(.)/g, (match, letter) => letter.toUpperCase());
    this[attr] = newval;
	}

	/**
   * Called when the element is inserted into the DOM.
   *
	 * @test mod.abortController instanceof AbortController \\ true
	 * @test mod.wrapper instanceof HTMLElement \\ true
	 * @test mod.closeBtn instanceof HTMLButtonElement \\ true
	 * @test mod.showBtn instanceof HTMLButtonElement \\ true
   */
	connectedCallback() {
		this.abortController = new AbortController();
		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.closeBtn = this.shadowRoot.querySelector('#close');
		this.showBtn = this.shadowRoot.querySelector('#show');
		this.addListeners();
		this.removeHidden();
		if (this.active) this.showDialog();
	}

	/**
	 * Called when the element is removed from the DOM
	 */
	disconnectedCallback() {
		this.abortController.abort();
		this.abortController = null;
	}

	/**
   * Adds event listeners for tooltip functionality.
   *
   * @test mod.showBtn.click(); return mod.dialog.open \\ true
   * @test a.when(() => mod.active === true) \\ true
   * @test mock mod.closeBtn.click() \\
   * @test a.when(() => mod.active === false) \\ true
   */
	addListeners() {
		this.showBtn.addEventListener('click', () => {
			this.showDialog();
		}, { signal:this.abortController.signal });

		this.dialog.addEventListener('close', () => {
			this.toggleAttribute('active', false);
		}, {signal:this.abortController.signal, passive:true});
	}

	/**
   * Hides the tooltip dialog.
   * @test mock mod.showDialog() \\
   * @test mod.hideDialog(); return mod.dialog.open \\ false
   */
	hideDialog() {
		delete this.dialog.dataset.method;
		this.dialog.close();
	}

	/**
	 * Removes `display` attriute slotted svg elements and `hidden` attribute from other slotted elements.
	 */
	removeHidden() {
		for (const elem of this.children) {
			if (elem.localName === 'svg') {
				elem.toggleAttribute('display', false);
			} else {
				elem.toggleAttribute('hidden', false);
			}
		}
	}

	/**
   * Shows the tooltip dialog based on its position.
   *
   * @test mock mod.position = 'modal'; \\
   * @test info "Make sure dialog was opened with showModal()" \\
   * @test mod.showDialog(); return mod.dialog.dataset.method \\ "showModal"
   * @test mock mod.hideDialog(); mod.position = 'center' \\
   *
   * @test info "Make sure dialog was opened with show()" \\
   * @test mod.showDialog(); return mod.dialog.dataset.method \\ "show"
   * @test mock mod.hideDialog(); mod.position = 'inline' \\

   * @test info "Make sure dialog is positioned so that its right edge doesn't run off the screen" \\
   * @test
   		const mywrapper = mod.shadowRoot.querySelector('#wrapper');
			const rect = mywrapper.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			return rect.right > viewportWidth \\ false

   * @test mock
   		mod.removeAttribute('position');
   		mod.hideDialog(); \\
   * @test a.when(() => mod.active === false) \\ true
   */
	showDialog() {
		if (this.wrapper) {
			this.wrapper.classList.remove('inline');
			this.wrapper.classList.remove('right-edge');
		}
		switch(this.position) {
		case 'modal':
			this.dialog.dataset.method = 'showModal';
			this.dialog.showModal();
			break;
		case 'inline':
			if (!this.wrapper) {
				// showDialog was probably called from a setter, which runs before connectedCallback()
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
			this.dialog.dataset.method = 'show';
			this.dialog.show();
		}

		this.toggleAttribute('active', true);
	}

	/**
   * Getter for the active state of the tooltip.
   *
   * @returns {boolean}
   *
   * @test mod.active \\ false
   */
	get active() { return this.#active }

	/**
   * Setter for the active state of the tooltip.
   * Toggles the active state and shows or hides the dialog accordingly.
   *
   * @param {any} value - The new value for the active state, always resolves to a boolean.
   *
   * @test mod.active = true; return mod.dialog.open \\ true
   * @test mod.active = false; return mod.dialog.open \\ false
   */
	set active(value) {
		value = !(value === 'false' || value === false || value === null);
		if (this.#active !== value) {
			this.#active = value;
			if (!this.#active) {
				this.hideDialog();
			} else {
				this.showDialog();
			}

			if (window.abind) abind.fire(this, 'active', value);
		}
	}

	/**
   * Getter for the position of the tooltip.
   *
   * @returns {string}
   *
   * @test mod.position \\ 'inline'
   */
	get position() { return this.#position }

	/**
   * Setter for the position of the tooltip.
   * Updates the position and fires an event if the value changes.
   *
   * @param {"inline" | "center" | "modal"} value - The new value for the position.
   */
	set position(value) {
		if (this.#position !== value) {
			this.#position = value;
			if (window.abind) abind.fire(this, 'position', value);
		}
	}

	/**
	 * @test mock mod.remove() \\
	 * @test this.abortController \\ undefined
	 */
} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
