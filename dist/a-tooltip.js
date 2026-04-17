const sheet = new CSSStyleSheet();
          sheet.replaceSync("/* @file src/a-tooltip-shadow.css */:host {display: inline-block;/* Prevents layout shift */min-height: var(--icon-size, 35px);min-width: var(--icon-size, 35px);}@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; }}::slotted(h1),::slotted(h2),::slotted(h3),::slotted(h4),::slotted(h5),::slotted(h6){ margin: 0}::slotted(img) {width: 100%;object-fit: cover;}::slotted(label) {cursor: var(--cursor, help);}::slotted(svg) {fill: var(--icon-color, white);width: 100%;}button {align-items: center;background: var(--icon-background, dodgerblue);border: 1px solid var(--border-color, silver);border-radius: var(--border-radius, 50%);box-sizing: border-box;color: var(--icon-color, white);display: inline-flex;font-weight: bold;justify-content: center;line-height: 0;outline: none;overflow: clip;}button#show {cursor: var(--cursor);font-size: calc( var(--icon-size, 35px) * .99 );height: var(--icon-size, 35px);width: var(--icon-size, 35px);}button#close {cursor: pointer;font-size: 34px;height: 35px;width: 35px;}button:focus,button:hover {background-color: var(--accent-color, dodgerblue);box-shadow: 1px 1px 2px gray;}button:active{ box-shadow: inset 1px 1px 2px gray; }dialog {border: 1px solid var(--border-color);border-radius: 5px;box-shadow: 2px 2px 5px black;padding: 0;}dialog[open],dialog[open]::backdrop { animation: fadeIn .25s ease-in-out; }dialog::backdrop {background: rgba(0,0,0,0.5);}dialog > form {display: flex;justify-content: space-between;}dialog > form > button {border-bottom-right-radius: 0;border-top-left-radius: 0;border-top-right-radius: 5px;}#message {font-size: small;overflow-wrap: normal;padding: var(--pad, .5rem);width: max-content;max-height: var(--message-size, 300px);max-width: var(--message-size, 300px);}#title {padding-top: var(--pad, .5rem);padding-left: var(--pad, .5rem);}#text {display: inline-block;width: max-content;}#triggers {align-items: center;display: flex;gap: .25rem;width: max-content;}#title ::slotted(*) { margin: 0 }#wrapper { width: stretch; }#wrapper.inline { position: relative; }#wrapper.inline.right-edge { position: unset; }#wrapper.inline dialog { left: calc(var(--icon-size, 35px) + var(--pad, .5rem)); }#wrapper.inline.right-edge dialog {width: unset;left: calc(100vw - var(--message-size, 300px));right: 10px;}");

/**
 * ATooltip class that extends HTMLElement to create a tooltip component.
 *
 * @file src/a-tooltip.js
 * @class ATooltip
 * @extends {HTMLElement}
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.5
 */


/**
 * Symbol used for integrating with abind data binding library.
 *
 * @type {symbol}
 */
const abindUpdate = Symbol.for('abind.update');

class ATooltip extends HTMLElement {

	// --- attributes --

	/**
	 * Whether the tooltip #tooltip is open (true) or closed (false)
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
	 * An html element which wraps the "open" button and the #tooltip
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
	static observedAttributes = ['position', 'active'];


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
						<slot name="tiptext"></slot>
					</span>

					<button id="show" tabindex="0" part="icon">
						<slot name="icon">?</slot>
					</button>
				</div>
			</div>
		`;
	};

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
		this.shadowRoot.append(ATooltip.template.content.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [sheet];
		this.#wrapper = this.shadowRoot.querySelector('#wrapper');
		this.#tooltip = this.shadowRoot.querySelector('dialog');
		this.#buttonTrigger = this.shadowRoot.querySelector('#show');
		this.#textTrigger = this.shadowRoot.querySelector('#text');
		this.#textSlot = this.shadowRoot.querySelector('slot[name="tiptext"]');
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
			if (!this.#active) {
				this.#hideDialog();
			} else {
				this.#showDialog();
			}
			globalThis[abindUpdate]?.(this, attr, this.#active);
			break;
		case 'position':
			this.#position = newval;
			globalThis[abindUpdate]?.(this, attr, newval);
			break;
		}
	}

	/**
   * Called when the element is inserted into the DOM.
   *
	 * @test mod.#abortController instanceof AbortController \\ true
	 * @test mod.#wrapper instanceof HTMLElement \\ true
	 * @test mod.closeBtn instanceof HTMLButtonElement \\ true
	 * @test mod.#buttonTrigger instanceof HTMLButtonElement \\ true
   */
	connectedCallback() {
		this.#abortController = new AbortController();

		const txtElems = this.#textSlot.assignedNodes().length;
		if (txtElems) this.#textTrigger.hidden = false;

		const computedStyles = window.getComputedStyle(this.#wrapper);
		this.#messageSize = computedStyles.getPropertyValue('--message-size').trim();
		this.#addListeners();
		if (this.active) this.#showDialog();
	}

	/**
	 * Called when the element is removed from the DOM
	 */
	disconnectedCallback() {
		if (this.#abortController) {
			this.#abortController.abort();
			this.#abortController = null;
		}
	}

	// -- Private --

	/**
   * Adds event listeners for tooltip functionality.
   *
   * @private
   *
   * @test mod.#buttonTrigger.click(); return mod.#tooltip.open \\ true
   * @test a.when(() => mod.active === true) \\ true
   * @test mock mod.closeBtn.click() \\
   * @test a.when(() => mod.active === false) \\ true
   */
	#addListeners() {
	  this.#buttonTrigger.addEventListener('click', (event) => {
	    event.stopPropagation();
	    this.#showDialog();
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
   *
   * @test mock mod.#showDialog() \\
   * @test mod.#hideDialog(); return mod.#tooltip.open \\ false
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
   *
   * @test mock mod.position = 'modal'; \\
   * @test info "Make sure #tooltip was opened with showModal()" \\
   * @test mod.#showDialog(); return mod.#tooltip.position \\ "showModal"
   * @test mock mod.#hideDialog(); mod.position = 'center' \\
   *
   * @test info "Make sure #tooltip was opened with show()" \\
   * @test mod.#showDialog(); return mod.#tooltip.position \\ "show"
   * @test mock mod.#hideDialog(); mod.position = 'inline' \\

   * @test info "Make sure #tooltip is positioned so that its right edge doesn't run off the screen" \\
   * @test
   		const mywrapper = mod.shadowRoot.querySelector('#wrapper');
			const rect = mywrapper.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			return rect.right > viewportWidth \\ false

   * @test mock
   		mod.removeAttribute('position');
   		mod.#hideDialog(); \\
   * @test a.when(() => mod.active === false) \\ true
   */
	#showDialog() {
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

	// -- Getters / Setters

	/**
   * Getter for the active state of the tooltip.
   *
   * @public
   * @returns {boolean}
   *
   * @test mod.active \\ false
   */
	get active() { return this.#active }

	/**
   * Setter for the active state of the tooltip.
   * Toggles the active state and shows or hides the #tooltip accordingly.
   *
   * @public
   * @param {any} value - The new value for the active state, always resolves to a boolean.
   *
   * @test mod.active = true; return mod.#tooltip.open \\ true
   * @test mod.active = false; return mod.#tooltip.open \\ false
   */
	set active(value) {
		value = value != null && String(value) !== "false";
		this.toggleAttribute('active', value);
	}

	/**
   * Getter for the position of the tooltip.
   *
   * @public
   * @returns {string}
   *
   * @test mod.position \\ 'inline'
   */
	get position() { return this.#position }

	/**
   * Setter for the position of the tooltip.
   * Updates the position and fires an event if the value changes.
   *
   * @public
   * @param {"inline" | "center" | "modal"} value - The new value for the position.
   */
	set position(value) { this.setAttribute('position', value); }

	/**
	 * @test mock mod.remove() \\
	 * @test this.#abortController \\ undefined
	 */
} // class

document.addEventListener('DOMContentLoaded', () => {
	if (!customElements.get('a-tooltip')) customElements.define('a-tooltip', ATooltip);
});

export { ATooltip as default };
