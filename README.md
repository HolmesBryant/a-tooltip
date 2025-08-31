# A-Tooltip

A web component that displays a tooltip.

Demo: [https://holmesbryant.github.io/a-tooltip/](https://holmesbryant.github.io/a-tooltip/)

## Features
- feature

## Usage

Include the script tag in your HTTML page.

    <script type="module" src="a-tooltip.min.js"></script>

Include the tag in the body, and include your content.

    <a-tooltip>
        ...
    </a-tooltip>

## Slots

There are two optional and one required slot.

The required slot is the message you want to display. this slot is named "message".

The next (optional) slot is named "title". Use this slot if you want your tooltip to have a title.

The last (optional) slot is named "symbol". Use this if you want to change the icon associated with the tooltip. The default is a question mark (?).

    <a-tooltip>
        <b slot="icon">!</b>
        <b slot="title">A Title</b>
        <div slot="message">The message</div>
    </a-tooltip>

## Attributes
- **active** OPTIONAL
    - Default: false
    - This is a boolean attribute that, when present, automatically shows the tooltip. It has no value, its presence alone triggers the effect.
- **activate** OPTIONAL
    - Default: "default"
    - Acceptable values: "click", "default"
    - How the tooltip is activated. The default behavior is to activate it when the user either hovers over the icon or long-presses on it. When you set the value to "click", the tooltip is only activated when you click (or tap) on it.
- **position** OPTIONAL
    - Default: "inline"
    - Acceptable values: "center", "inline" or "modal"
    - Where/how to display the message. "inline" displays the message next to the tooltip icon. "center" displays the message in the center of the viewport. "modal" displays it as a modal, so nothing on the page can be selected until the message dialog closes.

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
