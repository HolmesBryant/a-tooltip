/**
 * Test suite for ATooltip Web Component
 * @file a-tooltip.test.js
 */

import ATestRunner from './ATestRunner.min.js';
import '../dist/a-tooltip.js';

const runner = new ATestRunner(import.meta.url);
runner.output = "#test-results";

const {
  group,
  test,
  wait,
  when
} = runner;

// Helper to create and inject a fresh component for each test group
function createComponent() {
  const el = document.createElement('a-tooltip');
  document.body.append(el);
  return el;
}

group("1. Registration & Initial State", async () => {
  await customElements.whenDefined('a-tooltip');
  test("Component is successfully registered", customElements.get('a-tooltip') !== undefined, true);

  const el = createComponent();
  await when(() => el.shadowRoot !== null); // wait for component to mount

  test("Default active property is false", el.active, false);
  test("Default active attribute is not present", el.hasAttribute('active'), false);
  test("Default position is 'inline'", el.position, 'inline');

  const dialog = el.shadowRoot.querySelector('dialog');
  test("Dialog element exists in shadow root", dialog !== null, true);
  test("Dialog is closed initially", dialog.open, false);

  el.remove();
});

group("2. Getters, Setters, and Attributes", async () => {
  const el = createComponent();
  await wait(10);

  const dialog = el.shadowRoot.querySelector('dialog');

  // Test active property
  el.active = true;
  test("Setting active=true opens the dialog", dialog.open, true);
  test("Setting active=true reflects to attribute", el.hasAttribute('active'), true);

  el.active = false;
  test("Setting active=false closes the dialog", dialog.open, false);
  test("Setting active=false removes the attribute", el.hasAttribute('active'), false);

  // Test position property
  el.position = 'modal';
  test("Setting position property updates internal state", el.position, 'modal');
  test("Setting position property reflects to attribute", el.getAttribute('position'), 'modal');

  // Test attribute observation
  el.setAttribute('active', '');
  test("Setting 'active' attribute updates property to true", el.active, true);
  test("Setting 'active' attribute opens dialog", dialog.open, true);

  el.removeAttribute('active');
  test("Removing 'active' attribute updates property to false", el.active, false);
  test("Removing 'active' attribute closes dialog", dialog.open, false);

  el.remove();
});

group("3. User Interactions", async () => {
  const el = createComponent();
  await wait(10);

  const dialog = el.shadowRoot.querySelector('dialog');
  const showBtn = el.shadowRoot.querySelector('#show');

  // Trigger open
  showBtn.click();
  test("Clicking #show button sets active property to true", el.active, true);
  test("Clicking #show button opens the dialog", dialog.open, true);

  // Trigger close via backdrop click
  // Native dialog click events target the dialog itself when clicking the backdrop
  dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await wait(10); // Wait for event to process

  test("Clicking dialog backdrop sets active to false", el.active, false);
  test("Clicking dialog backdrop closes the dialog", dialog.open, false);

  el.remove();
});

group("4. Window & Layout Behavior", async () => {
  const el = createComponent();
  await wait(10);

  // Test Scroll Listener
  el.active = true;
  test("Tooltip is open before scroll event", el.active, true);

  window.dispatchEvent(new Event('scroll'));
  await wait(10); // Wait for passive event listener to fire

  test("Window scroll event closes the tooltip", el.active, false);

  // Test Inline layout adjustments
  el.position = 'inline';
  el.active = true;

  const wrapper = el.shadowRoot.querySelector('#wrapper');
  test("Opening as 'inline' adds 'inline' class to wrapper", wrapper.classList.contains('inline'), true);

  el.remove();
});

group("Cleanup", () => {
  test("All test elements removed from body", () => {
    document.querySelectorAll('a-tooltip').forEach(el => el.remove());
    return document.querySelector('a-tooltip') === null;
  }, true);
});

// Execute the test suite
runner.run();
