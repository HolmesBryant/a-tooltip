/**
 * @file a-tooltip-group.js
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 */

/**
 * A Custom Element (<a-tooltip-group>) that acts as a context provider for
 * child <a-tooltip> elements. It allows setting shared properties,
 * at a parent level to avoid repetition on children.
 *
 * @extends HTMLElement
 */
class ATooltipGroup extends HTMLElement {
  // -- Attributes --

  #nohover;
  #noicon;
  #position;

  // -- Properties --

  #childObserver;
  #children = new Set();
  #isConnected = false;
  #initPending = false;

  static observedAttributes = ['nohover', 'noicon', 'position'];

  constructor() { super(); }

  // --- Getters / Setters ---

  /**
   * Gets the value of the #nohover property.
   *
   * @public
   * @returns {boolean}
   */
  get nohover() { return this.#nohover }

  /**
   * Adds or removes the 'nohover' attribute.
   * true adds the attribute and disables hover functionality.
   * false removes the attribute and enables hover functionality.
   *
   * @public
   * @param {boolean} value
   */
  set nohover(value) {
    value = value != null && String(value) !== "false";
    this.toggleAttribute('nohover', value);
  }

  /**
   * Gets the value of the #noicon property.
   * Sets the noicon attribute:
   * - If value is truthy, adds the attribute.
   * - If value is falsy, removes the attribute.
   * @type {boolean}
   */
  get noicon() { return this.#noicon }
  set noicon(value) {
    value = value != null && String(value) !== "false";
    this.toggleAttribute('noicon', value);
  }

  /**
   * Gets or sets the 'position' attribute.
   * Represents whether the tooltip appears 'inline', 'center' in the screen, or as a 'modal'.
   * @type {string}
   */
  get position() { return this.#position }
  set position(value) { this.setAttribute('position', value); }

  // -- Lifecycle --

  /**
   * Called when an observed attribute changes.
   * Updates internal state and propagates changes to registered children.
   *
   * @param {string} attr - The attribute name.
   * @param {string} oldval - The old value.
   * @param {string} newval - The new value.
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval) return;
    console.log(attr, newval);
    switch (attr) {
      case 'nohover':
        this.#nohover = this.hasAttribute('nohover');
        this.#updateChildrenDefaults();
        break;
      case 'noicon':
        this.#noicon = this.hasAttribute('noicon');
        this.#updateChildrenDefaults();
        break;
      case 'position':
        this.#position = newval;
        this.#updateChildrenDefaults();
        break;
    }
  }

  /**
   * Called when the element is connected to the DOM.
   * Initializes the group. If children are not yet present, sets up a
   * MutationObserver to wait for them.
   */
  connectedCallback() {
    this.#isConnected = true;
    // if a-bindgroup was inserted into DOM programatically without first appending children
    if (!this.firstElementChild) {
      this.#childObserver = new MutationObserver(() => {
        if (this.#isConnected && this.querySelector('a-tooltip')) {
          if (this.#initPending) return;
          this.#initPending = true;
          requestAnimationFrame(() => {
            if (!this.#isConnected) return;
            if (this.#childObserver) {
              this.#childObserver.disconnect();
              this.#childObserver = null;
            }

            this.#initPending = false;
            this.#init();
          });
        }
      });

      this.#childObserver.observe(this, { childList: true });
    } else {
      this.#init();
    }
  }

  /**
   * Called when disconnected from the DOM.
   * Clears the registry of child elements.
   */
  disconnectedCallback() {
    this.#children.clear();
  }

  // --- Public ---

  /**
   * Registers a child element (a-tooltip) with this group.
   * Applies the group's configuration to the child
   * if the child has not explicitly defined them.
   *
   * @param {HTMLElement} child - The child element to register.
   * @returns {Promise<void>}
   */
  async register(child) {
    this.#children.add(child);
    this.#applyDefaultsToChild(child);
  }

  /**
   * Unregisters a child element from the group.
   * @param {HTMLElement} child - The child element to remove.
   */
  unregister(child) {
    this.#children.delete(child);
  }

  // --- Private ---

  /**
   * Applies the group's default settings (noicon, position)
   * to a specific child element.
   *
   * @private
   * @param {HTMLElement} child - The target child element.
   */
  async #applyDefaultsToChild(child) {
    await customElements.whenDefined('a-tooltip');
    // only apply if child hasn't defined its own
    console.log(this.#nohover);
    if (this.#nohover !== undefined && !child.hasAttribute('nohover')) child.nohover = this.#nohover;
    if (this.#noicon !== undefined && !child.hasAttribute('noicon')) child.noicon = this.#noicon;
    if (this.#position !== undefined && !child.hasAttribute('position')) child.position = this.#position;
  }

  /**
   * Initializes the group.
   * Resolves the model instance (if needed) and registers existing children.
   *
   * @private
   * @returns {Promise<void>}
   */
  #init() {
    if (!this.#isConnected) return;
    this.#registerChildren();
  }

  /**
   * Scans the DOM for nested <a-bind> or <a-repeat> elements
   * and registers them if they don't have their own model defined.
   *
   * @private
   */
  #registerChildren() {
    const children = this.querySelectorAll('a-tooltip');
    for (const child of children) {
      if (child.closest('a-tooltip-group') === this) {
        this.register(child);
      }
    }
  }

  /**
   * Iterates over all registered children and re-applies defaults.
   * Used when group attributes (like 'prop' or 'attr') change dynamically.
   *
   * @private
   */
  #updateChildrenDefaults() {
    for (const child of this.#children) {
      this.#applyDefaultsToChild(child);
    }
  }
}

if (!customElements.get('a-tooltip-group')) customElements.define('a-tooltip-group', ATooltipGroup);

const sheet = new CSSStyleSheet();
          sheet.replaceSync("/* @file src/a-tooltip-shadow.css */:host {display: inline-block;/* Prevents layout shift */min-height: var(--icon-size, 35px);min-width: var(--icon-size, 35px);}@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; }}@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; }}::slotted(h1),::slotted(h2),::slotted(h3),::slotted(h4),::slotted(h5),::slotted(h6){ margin: 0}::slotted(img) {width: 100%;object-fit: cover;}::slotted(*) {cursor: var(--cursor, help);}::slotted(svg) {fill: var(--icon-color, white);width: 100%;}button {align-items: center;background: var(--icon-background, dodgerblue);border: 1px solid var(--border-color, silver);border-radius: var(--border-radius, 50%);box-sizing: border-box;color: var(--icon-color, white);display: inline-flex;font-weight: bold;justify-content: center;line-height: 0;outline: none;overflow: clip;}button#show {cursor: var(--cursor);font-size: calc( var(--icon-size, 35px) * .99 );height: var(--icon-size, 35px);width: var(--icon-size, 35px);}button#close {background: var(--accent-color, dodgerblue);cursor: pointer;font-size: 34px;height: 35px;width: 35px;}button:focus,button:hover {background: var(--accent-color, dodgerblue);box-shadow: 1px 1px 2px black;outline: 2px solid var(--accent-color, dodgerblue);}button:active{ box-shadow: inset 1px 1px 2px gray; }dialog {border: 1px solid var(--border-color);border-radius: 5px;box-shadow: 2px 2px 5px black;padding: 0;}dialog[open],dialog[open]::backdrop { animation: fadeIn .25s ease-in-out; }dialog:not([open]){ animation: fadeOut .25s ease-in-out; }dialog::backdrop {background: rgba(0,0,0,0.5);}dialog > form {display: flex;justify-content: space-between;}dialog > form > button {border-bottom-right-radius: 0;border-top-left-radius: 0;border-top-right-radius: 5px;}.hide { display: none; }#message {font-size: small;overflow-wrap: normal;padding: var(--pad, .5rem);width: var(--message-size, max-content);max-height: var(--message-size, 300px);max-width: var(--message-size, 300px);}#title {padding-top: var(--pad, .5rem);padding-left: var(--pad, .5rem);}#text {display: inline-block;width: max-content;}#triggers {align-items: center;display: flex;gap: .25rem;width: max-content;}#title ::slotted(*) { margin: 0 }#wrapper { width: stretch; }#wrapper.inline { position: relative; }#wrapper.inline.right-edge { position: unset; }#wrapper.inline dialog { left: calc(var(--icon-size, 35px) + var(--pad, .5rem)); }#wrapper.inline.right-edge dialog {width: unset;left: calc(100vw - var(--message-size, 300px));right: 10px;}");

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
		this.attachShadow({mode:'open', delegatesFocus: true});
		this.shadowRoot.append(ATooltip.template.content.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [sheet];
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
   *
   * @test mod.#buttonTrigger.click(); return mod.#tooltip.open \\ true
   * @test a.when(() => mod.active === true) \\ true
   * @test mock mod.closeBtn.click() \\
   * @test a.when(() => mod.active === false) \\ true
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
		this.toggleAttribute('active', value);
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
