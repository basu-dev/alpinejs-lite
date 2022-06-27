import { evalString, walk, getXAttributes } from "./utils.js";

export class Component {
  constructor(el) {
    this.el = el;
    this.data = evalString(this.el.getAttribute("x-data"), { data: {} });
    this.listenForEvents();
    this.updateAttributes();
  }

  listenForEvents() {
    let eventNames = [];
    walk(this.el, (el) => {
      getXAttributes(el, "on").forEach((attr) =>
        eventNames.push(attr.split(":")[1])
      );
    });
    eventNames = [...new Set(eventNames)];

    eventNames.forEach((eventName) => {
      this.el.addEventListener(eventName, ($event) => {
        if ($event.target.hasAttribute(`x-on:${eventName}`)) {
          let expression = $event.target.getAttribute(`x-on:${eventName}`);
          evalString(expression, { data: this.data }, $event);
          this.updateAttributes();
        }
      });
    });
  }

  updateAttributes() {
    walk(this.el, (el) => {
      let attrs = getXAttributes(el, "bind");
      let realProps = attrs.map((prop) => prop.split(":")[1]);

      realProps.forEach((prop) => {
        let expression = el.getAttribute(`x-bind:${prop}`);
        let result = evalString(expression, { data: this.data });

        if (["hidden", "disabled", "checked"].includes(prop)) {
          this.handleBooleanAttris(result, el, prop);
        } else if (prop.includes("class")) {
          this.handleClassAttribute(result, el);
        } else if (prop.includes("style")) {
          this.handleStyleAttribute(result, el);
        } else if (prop.includes("text")) {
          this.handleTextAttribute(result, el);
        }
      });
    });
  }

  handleBooleanAttris(truthy, el, attribute) {
    if (truthy) {
      el[attribute] = true;
    } else {
      el[attribute] = false;
    }
  }

  handleClassAttribute(value, el) {
    if (el.getAttribute("reflect-class")) {
      el.classList.remove(el.getAttribute("reflect-class"));
    }
    el.classList.add(value);
    el.setAttribute("reflect-class", value);
  }

  handleStyleAttribute(value, el) {
    Object.keys(value).forEach((key) => {
      el.style[key] = value[key];
    });
  }

  handleTextAttribute(value, el) {
    el.innerText = value;
  }
}
