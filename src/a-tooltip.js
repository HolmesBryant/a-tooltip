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
	#position = 'modal';

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

	/**
	 * Creates an instance of ATooltip
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
   * @test mock
   		a.mod = document.createElement('a-tooltip');
			mod.connectedCallback() \\
		* @test mod.abortController instanceof AbortController \\ true
		* @test mod.wrapper instanceof HTMLElement \\ true
		* @test mod.showBtn instanceof HTMLButtonElement \\ true
   */
	connectedCallback() {
		this.abortController = new AbortController();
		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.showBtn = this.shadowRoot.querySelector('#show');
		this.addListeners();
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
   * @test mod.showBtn.click(); return mon.dialog.hasAttribute('open') \\ true
   * @test mod.closeBtn.click(); return mod.active; \\ false
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
   * @test mock if (!mod.dialog.hasAttribute('open')) mod.dialog.open() \\
   * @test mod.hideDialog(); return mod.dialog.hasAttribute('open') \\ false
   */
	hideDialog() {
		this.dialog.close();
	}

	/**
   * Shows the tooltip dialog based on its position.
   *
   * @test mock mod.position = 'modal'; \\
   * @test info " position is 'modal' " \\
   * @test mod.showDialog(); return mod.dialog.open === '' \\ false
   * @test mock mod.hideDialog(); mod.position = 'center' \\
   *
   * @test info " positon is 'center' " \\
   * @test mod.showDialog(); return mod.dialog.open === '' \\ true
   * @test mock mod.hideDialog(); mod.position = 'inline';
   *
   * @test info " position is 'inline' " \\
   * @test
   			const mywrapper = mod.dialog.querySelector('#wrapper');
				const rect = mywrapper.getBoundingClientRect();
				const viewportWidth = window.innerWidth;
				return rect.right > viewportWidth \\ false
   *
   * @test mock mod.position = 'modal'; mod.hideDialog() \\
   */
	showDialog() {
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
   * @test mod.active = true; return mod.dialog.hasAttribute('open') \\ true
   * @test mod.active = false; return mod.dialog.hasAttribute('open') \\ false
   */
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

	/**
   * Getter for the position of the tooltip.
   *
   * @returns {string}
   *
   * @test mod.position \\ 'modal'
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
		}
		abind.fire('position', value);
	}
} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
