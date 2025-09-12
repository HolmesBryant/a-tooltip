# A-Tooltip

A web component that displays a tooltip icon which, when clicked, displays message.

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

There are two optional slots, "title" and "icon".

Add an element with the attribute `slot="title"` if you want your tooltip to have a title.

Add an element with the attribute `slot="icon"` if you want to change the icon associated with the tooltip. The default is a question mark (?).

    <a-tooltip>
        <b slot="icon">!</b>
        <b slot="title">The Tooltip Title</b>
        The tooltip message.
    </a-tooltip>

## Attributes
- **active** OPTIONAL
    - Default: false
    - This is a boolean attribute that, when present, automatically shows the tooltip. It has no value, its presence alone triggers the effect.
- **position** OPTIONAL
    - Default: "inline"
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
        --accent-color: orange;
        --border-color: silver;
        --border-radius: 50%;
        --cursor: pointer;
        --message-size: 300px;
        --icon-background: dodgerblue;
        --icon-color: white;
        --icon-size: 35px;
        --pad: .5rem;
    }

Note: --message-width is defined as `max-width` so if your message is short, the dialog will shrink to the content.

## Preventing FUC! (Flash of Unstyled Content)

If you are getting a flash of unstyled content, you can mitigate this by adding an attribute to all direct children of the custom element.

If the element is an inline svg, add the attribute `display="none"`. (**Not** `style="display:none"`).

If the element is a normal HTML element, add the `hidden` attribute.

    <a-tooltip>
        <svg slot="icon" display="none">...</svg>
        <strong slot="title" hidden>The Title</strong>
        <div hidden>The tooltip message</div>
    </a-tooltip>

Once the custom element has been registered and styles applied, the attributes `hidden` and `display` will be automatically removed.

If you are also getting unwanted layout shift, you can solve this using css.

    /* Example CSS */
    a-tooltip {
        --icon-size: 35px;
        width: var(--icon-size);
        height: var(--icon-size);
    }

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

