/*
# 1. Look for all the elements in dom having x-data attribute and initialize component for each element
# 2. Parse the data provided as string to x-data attribute and convert it to object ( Most crucial part)
3. Update the Dom with the data state
4. Listen for events in the DOM tree
*/
import {
  handleBindings,
  handleBooleanAttributes,
  handleClass,
  handleHtml,
  handleIf,
  handleText,
  handleValue,
} from "./handle.js";
import { evalString, getXAttributes, getXBindType, walk } from "./helper.js";

class Component {
  constructor(el) {
    this.$el = el;
    this.$data = this.proxify(evalString(this.$el.getAttribute("x-data"), {}));
    this.initialize();
    this.updateDOM();
    this.registerEvents();
    this.$startProxyUpdate = true;
  }

  proxify(object) {
    let self = this;
    let props = [];
    let modifier = {
      set(obj, prop, value) {
        obj[prop] = value;
        if (self.$startProxyUpdate) {
          props.push(prop);
          // This queueMicrotask is used so that if two props are changed by one action, two updateDOM method is not called
          queueMicrotask(() => {
            if (props.length == 0) return;
            self.updateDOM(props);
            props.length = 0;
          });
        }
        return true;
      },
    };
    return new Proxy(object, modifier);
  }

  initialize() {
    // Provide update api to the user in case of async data
    this.$data.$$update = this.updateDOM.bind(this);

    // Call init method if provided
    if (this.$data.init && typeof this.$data.init == "function") {
      this.$data.init();
    }
  }

  updateDOM(modifiedProps = []) {
    // Get all x-bind related attributes and update according to the expression provided
    walk(this.$el, (element) => {
      let attrTypes = getXAttributes(element, "bind");
      if (attrTypes.length == 0) return;
      attrTypes.forEach((attrType) =>
        this.handleAttributes(element, attrType, { modifiedProps })
      );
    });
  }

  shouldEvaluateExpression(modifiedProps, expression) {
    if (!this.$startProxyUpdate) return true;
    if (modifiedProps.length == 0) return false;
    let truth = modifiedProps.some((prop) => expression.includes(prop));
    return truth;
  }

  handleAttributes(element, attrType, { modifiedProps } = data) {
    let expression = element.getAttribute(attrType);
    if (!this.shouldEvaluateExpression(modifiedProps, expression)) return;
    let attr = getXBindType(attrType);
    let commonObj = {
      element,
      expression,
      data: this.$data,
    };
    let booleanObj = Object.assign({ attr }, commonObj);
    switch (attr) {
      case "disabled":
      case "checked":
        handleBooleanAttributes(booleanObj);
        break;
      case "src":
        handleBindings(booleanObj);
        break;
      case "value":
        handleValue(commonObj);
        break;
      case "text":
        handleText(commonObj);
        break;
      case "html":
        handleHtml(commonObj);
        break;
      case "class":
        handleClass(commonObj);
        break;
      case "if":
        handleIf(commonObj);
        break;
    }
  }

  registerEvents() {
    // List out all the possible events that would occur in the html and add listener only on root element, called event delegation
    let xOnAttrs = [];
    walk(this.$el, (element) => {
      let onAttrs = getXAttributes(element, "on");
      if (onAttrs.length == 0) return;
      xOnAttrs = [...xOnAttrs, ...onAttrs];
    });

    // Adding any future events as well
    if (this.$data.$futureEvents && Array.isArray(this.$data.$futureEvents)) {
      xOnAttrs = [
        ...xOnAttrs,
        ...this.$data.$futureEvents.map((type) => `x-on:${type}`),
      ];
    }

    xOnAttrs.forEach((type) => this.handleListener(type));
  }

  handleListener(type) {
    let eventType = getXBindType(type);
    this.$el.addEventListener(eventType, (event) => {
      let el = event.target;
      let onAttrs = getXAttributes(el, "on");

      if (onAttrs.length == 0) return;
      if (!onAttrs.some((attr) => attr.includes(type))) return;

      let expression = el.getAttribute(type);
      evalString(expression, this.$data, event);
    });
  }
}

document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
