# A-Tooltip

A web component that displays a tooltip icon which, when clicked, displays a message.

Demo: [https://holmesbryant.github.io/a-tooltip/](https://holmesbryant.github.io/a-tooltip/)

## Features
- You can position the tooltip message inline, in the center of the viewport, or as a modal.
- You can automatically show the tooltip message when the page loads via the attribute 'active'.
- You can use your own icon (character, svg or image). This is what the user clicks on to display the message.
- You can use css custom properties in a stylesheet, style tag or style attribute to change the accent color, border color, message size, icon background color, icon color, icon size and padding.

## Usage

Include the script tag in your HTML page. Include the attribute `type="module"`.

    <script type="module" src="path/to/a-tooltip.min.js"></script>

Optional: Include the a-tooltip stylesheet.

    <link rel="stylesheet" href="path/to/a-tooltip.css">

Include the a-tooltip tag in the body with your message.

    <a-tooltip>
        The tooltip message.
    </a-tooltip>

## Slots

- **title** Places the slotted element into the title section of the tooltip dialog.

- **icon** Replaces the default icon (?) with a custom one.

- **text** Makes the slotted text interactive so it behaves the same way the icon behaves.

```html
<a-tooltip>
    <b slot="icon">!</b>
    <b slot="title">Tooltip Title</b>
    <label slot="text" for="my-input">
        A label
    </label>
    The tooltip message.
</a-tooltip>
```

## Attributes

- **active** (default: false)
    - A boolean attribute that, when present, automatically shows the tooltip. It has no value, its presence alone triggers the effect.

- **noicon** (default: false)
    - A boolean attribute that, when present, hides the tooptip icon.

- **nohover** (default: false)
    - A boolean attribute that, when present, disables hover functionality. The user can still click on a tooltip trigger to see the message.

- **position** (default: "inline")
    - Acceptable values: "center", "inline" or "modal"
    - Where/how to display the message. "inline" displays the message next to the tooltip icon. "center" displays the message in the center of the viewport. "modal" displays it as a modal, so nothing on the page can be selected until the message dialog closes.

### Example

    <a-tooltip active position="modal">
      tooltip message
    </a-tooltip>

## CSS Custom Properties

This component exposes several custom css properties which affect the appearance.

    /* Example CSS */
    a-tooltip {
        --accent-color: dodgerblue;
        --border-color: silver;
        --border-radius: 50%;
        --cursor: help;
        --message-size: 300px;
        --icon-background: dodgerblue;
        --icon-color: white;
        --icon-size: 35px;
        --pad: .5rem;
    }

## a-tooltip-group

a-tooltip-group groups several a-tooltip elements which share common attributes. This allows you to set attributes on a single parent element (a-tooltip-group) which all child a-tooltip elements will inherit. Explicit attributes set on any child a-tooltip will be honored.

```html
    <style>
        a-tooltip-group a-tooltip {
            --icon-size: 1rem;
        }
    </style>

    <a-tooltip-group
        nohover
        position="modal">

        <div>
            <a-tooltip>
                <label slot="text">
                    Foo
                </label>
                <b slot="title">
                    Tooltip!
                </b>
            </a-tooltip>
            <input>
        </div>
        ....
    </a-tooltip-group>
```

## Examples

### Tooltip with a title and a message

    <a-tooltip>
        <strong slot="title">The Title</strong>
        The tooltip message
    </a-tooltip>

### Tooltip with only a message

    <a-tooltip>
        The tooltip message.
    <a-tooltip>

### Tooltip with only a title

    <a-tooltip>
        <span slot="title">...</span>
    <a-tooltip>

### Opening the tooltip message as a modal

    <a-tooltip position="modal">
        The tooltip message
    </a-tooltip>

### Automatically opening the tooltip message on page load

    <a-tooltip active>
        The tooltip message
    </a-tooltip>


### Using an svg element as the tooltip icon.

The svg fill color **ignores** --icon-color when you include the svg as an img.

    <a-tooltip>
        <img slot="icon" src="star.svg">
        The tooltip message.
    </a-tooltip>

The svg fill color **inherits** --icon-color when you include the svg directly in the HTML.

    <a-tooltip>
        <svg slot="icon" xmlns="http://www.w3.org/2000/svg">
            ...
        </svg>
        The tooltip message.
    </a-tooltip>

### Remove the icon and make some text the tooltip trigger

    <a-tooltip noicon>
        <label slot="text" for="my-input">Click me!</label>
        <p>Tooltip message</p>
    </a-tooltip>
    <input id="my-input">

### Using a square image as the icon.

Normally the tooltip icon displays as a circle, but with css you can coerce it into a square.

    <a-tooltip style="--border-radius: 0">
        <img slot="icon" src="square-image.jpg">
        The tooltip message
    </a-tooltip>

### Using a-tooltip as a simple lightbox

    <a-tooltip position = "modal">
        <img slot="icon" src="thumbnail.jpg">
        <figure>
            <img src="image.jpg">
            <figcaption> ... </figcaption>
        </figure>
    </a-tooltip>

    /* Example CSS */
    a-tooltip {
        --message-size: auto;
    }
    a-tooltip figure {
        padding: 0;
        margin: 0;
    }
    a-tooltip figure img {
        width: 100%;
        max-height: 75svh;
        object-fit: contain;
    }
    a-tooltip figcaption {
        text-align: center;
    }

## Change Log

- v 1.6 Introduce a-tooltip-group to allow parent-level defaults for child a-tooltip elements and register/unregister children. Add 'nohover' attribute and hover controller to ATooltip so hover can be disabled/enabled programmatically or via group inheritance; rename 'tiptext' slot to 'text' and enable delegatesFocus on the shadow root. Update CSS to include fadeOut, focus outline, and change accent variable. Bump ATooltip version to 1.6 and update README and examples to document new slots, attributes (nohover, noicon) and the a-tooltip-group usage. Build artifacts and minified files were regenerated accordingly.

- v 1.5 Tuned many methods of ATooltip for performance. Reconfigured devDependencies.

- v 1.0 yay!
