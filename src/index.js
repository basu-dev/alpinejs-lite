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
import { handleFor } from "./handleFor.js";
import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  getXBindType,
  getXData,
  walk,
} from "./helper.js";

class Component {
  constructor(el) {
    this.$el = el;
    this.$state = this.proxify(evalString(this.$el.getAttribute("x-data")));
    this.initialize();
    this.updateNodeBindings({ hostElement: this.$el, state: this.$state });
    this.registerEvents({ delegateTo: this.$el, state: this.$state });
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
          // This queueMicrotask is used so that if two props are changed by one action, two updateNodeBindings method is not called
          queueMicrotask(() => {
            // Sometimes value is nothing. so need to check that as well. I dont know why
            if (props.length == 0) return;
            self.updateNodeBindings(
              { hostElement: self.$el, state: self.$state },
              props
            );
            props.length = 0;
          });
        }
        return true;
      },
    };
    return new Proxy(object, modifier);
  }

  initialize() {
    // Call init method if provided
    if (this.$state.init && typeof this.$state.init == "function") {
      this.$state.init();
    }
  }

  updateNodeBindings({ hostElement } = data, modifiedProps = []) {
    // Get all x-bind related attributes and update according to the expression provided
    walk(hostElement, (element) => {
      let attrTypes = getXAttributes(element, "bind");
      if (attrTypes.length == 0) return;
      this.addXDataForElement(element);
      attrTypes.forEach((attrType) =>
        this.handleAttributes(element, attrType, { modifiedProps })
      );
    });
  }

  addXDataForElement(element) {
    if (getXData(element).length == 0) {
      appendXDataToElement(element, this.$state);
    }
  }

  shouldEvaluateExpression(modifiedProps, expression, attrType) {
    // todo: remove this and solve for x-for update
    if (attrType == "x-bind:text") return true;
    if (!this.$startProxyUpdate) return true;
    let truth = modifiedProps.some((prop) => expression.includes(prop));
    return truth;
  }

  handleAttributes(element, attrType, { modifiedProps } = data) {
    let expression = element.getAttribute(attrType);
    if (!this.shouldEvaluateExpression(modifiedProps, expression, attrType))
      return;

    let attr = getXBindType(attrType);
    let commonObj = {
      element,
      expression,
      self: this,
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
      case "for":
        handleFor(commonObj);
        break;
    }
  }

  registerEvents({ delegateTo }) {
    // List out all the possible events that would occur in the html and add listener only on root element, called event delegation
    let xOnAttrs = [];
    walk(this.$el, (element) => {
      this.addXDataForElement(element);
      let onAttrs = getXAttributes(element, "on");
      if (onAttrs.length == 0) return;
      xOnAttrs = [...xOnAttrs, ...onAttrs];
    });

    // Adding any future events as well
    if (this.$state.$futureEvents && Array.isArray(this.$state.$futureEvents)) {
      xOnAttrs = [
        ...xOnAttrs,
        ...this.$state.$futureEvents.map((type) => `x-on:${type}`),
      ];
    }
    xOnAttrs = [...new Set(xOnAttrs)];

    xOnAttrs.forEach((type) => this.handleListener(type, { delegateTo }));
  }

  handleListener(type, { delegateTo }) {
    let eventType = getXBindType(type);
    delegateTo.addEventListener(eventType, (event) => {
      let el = event.target;
      let onAttrs = getXAttributes(el, "on");

      if (onAttrs.length == 0) return;
      if (!onAttrs.some((attr) => attr.includes(type))) return;

      let expression = el.getAttribute(type);
      evalString(expression, el._x__data, { $event: event });
    });
  }
}

document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
