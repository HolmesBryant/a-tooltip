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
export default class ATooltipGroup extends HTMLElement {
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

  constructor() { super() }

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
  set position(value) { this.setAttribute('position', value) }

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
    console.log(this.#nohover)
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
