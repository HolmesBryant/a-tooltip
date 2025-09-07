# A-Tooltip

A web component that displays a tooltip. An icon

Demo: [https://holmesbryant.github.io/a-tooltip/](https://holmesbryant.github.io/a-tooltip/)

## Features
- You can position the tooltip message inline, in the center of the viewport, or as a modal.
- You can automatically show the tooltip message when the page loads via the attribute 'active'.
- You can use your own icon (character, svg or image). This is what the user clicks on to display the message.
- You can use css custom properties in a stylesheet, script tag or script attribute to change the accent color, border color, message size, icon background color, icon color, icon size and padding

## Usage

Include the script tag in your HTML page. Include the type="module" attribute.

    <script type="module" src="a-tooltip.min.js"></script>

Include the a-tooltip tag in the body with your message.

    <a-tooltip>
        The tooltip message.
    </a-tooltip>

## Slots

There are two optional slots, "title" and "icon".

Add an element with the attribute slot="title" if you want your tooltip to have a title.

Add an element with the attribute slot="icon" if you want to change the icon associated with the tooltip. The default is a question mark (?).

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

This component exposes several custom css properties which affect the appearance. You must set these properties on the custom element.

Note: --message-width is defined as max-width, so if your message is short, the dialog will shrink to the content.

    /* Example css */
    a-tooltip {
        --symbol-size: 35px;
        --symbol-color: white;
        --symbol-background: dodgerblue;
        --accent-color: orange;
        --border-color: silver;
        --message-width: 400px;
    }

## Examples

### Example One


## Special Note
