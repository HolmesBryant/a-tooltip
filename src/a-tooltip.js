/**
 * ATooltip class that extends HTMLElement to create a tooltip component.
 *
 * @file src/a-tooltip.js
 * @class ATooltip
 * @extends {HTMLElement}
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.6
 */

import ATooltipGroup from './a-tooltip-group.js';

import styles from './a-tooltip-shadow.css' with {type: 'css'};

/**
 * Symbol used for integrating with abind data binding library.
 *
 * @type {symbol}
 */
const abindUpdate = Symbol.for('abind.update');

export default class ATooltip extends HTMLElement {

	// --- attributes --

	/**
	 * Whether the tooltip #tooltip is open (true) or closed (false)
	 *
	 * @private
	 * @type {boolean}
	 */
	#active = false;

	/**
	 * Whether hover functionality should be disabled
	 *
	 * @private
	 * @type {boolean}
	 */
	#nohover = false;

	/**
	 * Whether the icon is omitted
	 *
	 * @private
	 */
	#noicon = false;

	/**
	 *Tooltip position, can be 'center', 'inline' or 'modal'.
   *
   * @private
   * @type {string}
   */
	#position = 'inline';

	// -- properties --

	/**
	 * AbortController for removing event listeners when element is removed from the DOM
	 *
	 * @private
	 * @type {AbortController}
	 */
	#abortController;

	/**
	 * The HTML button element which is clicked to show the tooltip message.
	 *
	 * @private
	 * @type {HTMLButtonElement}
	 */
	#buttonTrigger;

	/**
	 * determine if connectedCallback() has run
	 * @private
	 */
	#connected = false;

	/**
	 * AbortController for removing 'pointerenter' event listeners
	 *
	 * @private
	 * @type {AbortController}
	 */
	#hoverController

	/**
	 * HTML element which wraps the icon slot
	 *
	 * @private
	 */
	#icon;

	#messageSize;

	/**
	 * The HTML dialog element in which the tooltip message is displayed.
	 *
	 * @private
	 * @type {HTMLDialogElement}
	 */
	#tooltip;

	/**
	 *
	 * @private
	 */
	#scrollController;

	/**
	 * The slot element that contains the custom text trigger for the tooltip.
	 *
	 * @private
	 * @type {HTMLSlotElement}
	 */
	#textSlot;

	/**
	 * The wrapper element for the text trigger slot, hidden by default.
	 *
	 * @private
	 * @type {HTMLSpanElement}
	 */
	#textTrigger;

	/**
	 * html element which wraps the "open" button and the #tooltip
	 *
	 * @private
	 * @type {HTMLElement}
	 */
	#wrapper;

	/**
	 * List of observed attributes.
	 *
	 * @static
	 * @type {Array<string>}
	 */
	static observedAttributes = ['position', 'nohover', 'noicon','active'];


	/**
   * Template containing styles and HTML structure for the tooltip component.
   *
   * @static
   * @type {HTMLTemplateElement}
   */
	static template = document.createElement('template');

	static {
		this.template.innerHTML = `
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

				<div id="triggers">
					<span hidden id="text">
						<slot name="text"></slot>
					</span>

					<button id="show" part="icon">
						<slot name="icon">?</slot>
					</button>
				</div>
			</div>
		`
	};

	/**
	 * Creates an instance of ATooltip
	 */
	constructor() {
		super();
		this.attachShadow({mode:'open', delegatesFocus: true});
		this.shadowRoot.append(ATooltip.template.content.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [styles];
		this.#wrapper = this.shadowRoot.querySelector('#wrapper');
		this.#tooltip = this.shadowRoot.querySelector('dialog');
		this.#buttonTrigger = this.shadowRoot.querySelector('#show');
		this.#textTrigger = this.shadowRoot.querySelector('#text');
		this.#textSlot = this.shadowRoot.querySelector('slot[name="text"]');
		this.#icon = this.shadowRoot.querySelector('#show');
	}

	// -- Lifecycle --

	/**
   * Called when an attribute is changed, added, or removed.
   *
   * @param {string} attr - The name of the attribute.
   * @param {any} oldval - The old value of the attribute.
   * @param {any} newval - The new value of the attribute.
   */
	attributeChangedCallback(attr, oldval, newval) {
		if (oldval === newval) return;
		switch (attr) {
		case 'active':
			this.#active = this.hasAttribute('active');
			if (!this.#connected) return;
			if (!this.#active) {
				this.#hideDialog();
			} else {
				this.#showDialog();
			}
			globalThis[abindUpdate]?.(this, attr, this.#active);
			break;
		case 'nohover':
			this.#nohover = this.hasAttribute('nohover');
			if (this.#connected) {
				this.#canHover(this.#nohover);
				globalThis[abindUpdate]?.(this, attr, this.#nohover);
			}
			break;
		case 'noicon':
			this.#noicon = this.hasAttribute('noicon');
			if (this.#noicon) {
				this.#icon.classList.add('hide');
			} else {
				this.#icon.classList.remove('hide');
			}
			globalThis[abindUpdate]?.(this, attr, this.#noicon);
			break;
		case 'position':
			this.#position = newval;
			if (!this.#connected) return;
			if (this.active) this.#reset();
			globalThis[abindUpdate]?.(this, attr, newval);
			break;
		}
	}

	/**
   * Called when the element is inserted into the DOM.
   */
	connectedCallback() {
		this.#abortController = new AbortController();

		const txtElems = this.#textSlot.assignedNodes().length;
		if (txtElems) this.#textTrigger.hidden = false;

		const computedStyles = window.getComputedStyle(this.#wrapper);
		this.#messageSize = computedStyles.getPropertyValue('--message-size').trim();
		this.#addListeners();
		this.#canHover(this.#nohover);

		if (this.active) {
			requestAnimationFrame(() => {
			  requestAnimationFrame(() => {
			    this.#showDialog();
			  });
			});
		}

		this.#connected = true;
	}

	/**
	 * Called when the element is removed from the DOM
	 */
	disconnectedCallback() {
		if (this.#abortController) {
			this.#abortController.abort();
			this.#abortController = null;
		}

		if (this.#hoverController) {
			this.#hoverController.abort();
			this.#hoverController = null;
		}
	}

	// -- Private --

	#canHover(nope = true) {
		if (!nope) {
			this.#hoverController = new AbortController;
			this.#buttonTrigger.addEventListener('pointerenter', (event) => {
		    event.stopPropagation();
		    this.active = !this.active;
		  }, { signal: this.#hoverController.signal });

		  this.#textTrigger.addEventListener('pointerenter', (event) => {
		    event.stopPropagation();
		    this.#showDialog();
		  }, { signal: this.#hoverController.signal });
		} else {
			if (this.#hoverController) {
				this.#hoverController.abort();
				this.#hoverController = null;
			}
		}
	}

	/**
   * Adds event listeners for tooltip functionality.
   *
   * @private
   */
	#addListeners() {
	  this.#buttonTrigger.addEventListener('click', (event) => {
	    event.stopPropagation();
	    this.active = !this.active;
	  });

	  this.#textTrigger.addEventListener('click', (event) => {
	    event.stopPropagation();
	    this.#showDialog();
	  });

	  // Close when clicking the dialog ::backdrop
	  this.#tooltip.addEventListener('click', (event) => {
	    if (event.target === this.#tooltip) this.#hideDialog();
	  });

	  this.#tooltip.addEventListener('close', () => {
			this.toggleAttribute('active', false);
		}, {signal:this.#abortController.signal, passive:true} );
	}

	/**
   * Hides the tooltip dialog.
   *
   * @private
   */
	#hideDialog() {
		this.#tooltip.close();
		if (this.#scrollController) {
	    this.#scrollController.abort();
	    this.#scrollController = null;
	  }
	}

	/**
   * Shows the tooltip dialog based on its position.
   *
   * @private
   */
	#showDialog() {
		if (this.#tooltip.open) return;

		if (this.#wrapper) {
			this.#wrapper.classList.remove('inline');
			this.#wrapper.classList.remove('right-edge');
		}
		switch(this.position) {
		case 'modal':
			this.#tooltip.showModal();
			break;
		case 'inline':
			if (!this.#wrapper) {
				// #showDialog was probably called from a setter, which runs before connectedCallback()
				customElements.whenDefined('a-tooltip')
				.then(() => this.#showDialog());
			} else {
				const rect = this.#wrapper.getBoundingClientRect();
				const distanceToRight = window.innerWidth - (rect.right + window.scrollX) - 20;

				this.#wrapper.classList.add('inline');
				if (distanceToRight < parseFloat(this.#messageSize)) {
					this.#wrapper.classList.add('right-edge');
				}
				this.#tooltip.show();
			}
			break;
		default:
			this.#tooltip.show();
		}

		this.toggleAttribute('active', true);
		this.#scrollController = new AbortController();
		window.addEventListener('scroll', () => {
		  if (this.#tooltip.open) this.#hideDialog();
		}, { passive: true, signal: this.#scrollController.signal });
	}

	#reset() {
		this.active = false;
		requestAnimationFrame(() => {
			this.active = true;
		});
	}

	// -- Getters / Setters

	/**
   * Getter for the active state of the tooltip.
   *
   * @public
   * @returns {boolean}
   */
	get active() { return this.#active }

	/**
   * Setter for the active state of the tooltip.
   * Toggles the active state and shows or hides the #tooltip accordingly.
   *
   * @public
   * @param {boolean} value
   */
	set active(value) {
		value = value != null && String(value) !== "false";
		this.toggleAttribute('active', value)
	}

	/**
	 * Gets the value of the #nohover property
	 *
	 * @public
	 * @returns {boolean}
	 */
	get nohover() { return this.#nohover }

	/**
	 * Sets the value of #nohover. true disables hover functionality. false enables it.
	 *
	 * @public
	 * @param {boolean} value
	 */
	set nohover(value) {
		value = value != null && String(value) !== 'false';
		this.toggleAttribute('nohover', value);
	}

	/**
	 * Gets the value of the #noicon property
	 *
	 * @public
	 * @returns {boolean}
	 */
	get noicon() { return this.#noicon }

	/**
	 * Sets the value of #noicon. true means no icon is visible. false means it is visible.
	 *
	 * @public
	 * @param {boolean} value
	 */
	set noicon(value) {
		value = value != null && String(value) !== "false";
		this.toggleAttribute('noicon', value);
	}

	/**
   * Getter for the position of the tooltip.
   *
   * @public
   * @returns {string}
   */
	get position() { return this.#position }

	/**
   * Setter for the position of the tooltip.
   * Updates the position and fires an event if the value changes.
   *
   * @public
   * @param {"inline" | "center" | "modal"} value - The new value for the position.
   */
	set position(value) { this.setAttribute('position', value) }

} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});
