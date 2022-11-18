/*
# 1. Look for the element in dom having x-data attribute and initialize component for that element
# 2. Parse the data provided as string to x-data attribute and convert it to object ( Most crucial part)
3. Update the Dom with the data state
4. Listen for events in the DOM tree
*/
import { handleAttributeByType } from "./handle/handle.js";
import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  getXBindType,
  walk,
} from "./helper.js";
import { handleListener } from "./registerEvents.js";

class Component {
  constructor(el) {
    this.$el = el;
    // This _x__component is used in case this element is nested inside another x-data to determine whether
    // already a component is instantiated for this element or not.
    // Can also be used for debugging purpose
    el._x__component = this;

    let expression = this.$el.getAttribute("x-data");
    if (expression) {
      this.$state = this.proxify(evalString(expression));
    } else {
      this.$state = {};
    }

    this.initialize();
    this.updateNodeBindings({ hostElement: this.$el, state: this.$state });
    this.registerEvents({ delegateTo: this.$el, state: this.$state });

    // After initial node bindings update, and registerEvents we set $startProxyUpdate to true
    // so that only changed prop can update the dom (used inside proxify method)
    this.$startProxyUpdate = true;
  }

  proxify(object) {
    let self = this;
    let props = [];

    // This modifier defines setter for each property of the state, so if any one of the prop changes,
    // it fires updateNodeBinding method with the prop that has changed, so that element with unchanged
    // prop would not be updated
    let modifier = {
      set(obj, prop, value) {
        // If value has not changed, we need not to call update
        if (obj[prop] && obj[prop] == value) return;

        obj[prop] = value;

        // $startProxyUpdate is set to true, once all the element attributes are updated with initial state, then updating of
        // nodes is done through here
        if (self.$startProxyUpdate) {
          props.push(prop);

          // This queueMicrotask is used so that if two props are changed by one action, two updateNodeBindings method is
          // not calle we collect all the props that are changed and fire updateNodeBindings method with array of those props
          queueMicrotask(() => {
            if (props.length == 0) return;
            self.updateNodeBindings({ hostElement: self.$el }, props);
            self.$children.forEach((child) =>
              child.updateNodeBindings({ hostElement: child.$el }, props)
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
    // nested components go here. It is used inside proxify to update child components
    this.$children = [];
    // Call init method if provided
    if (this.$state.init && typeof this.$state.init == "function") {
      this.$state.init();
    }

    // Now we add current state to all element's _x__data array
    walk(this.$el, (element) => {
      let xAttrs = getXAttributes(element);
      if (xAttrs.length == 0) return;

      appendXDataToElement(element, this.$state);
    });
  }

  updateNodeBindings({ hostElement } = data, modifiedProps = []) {
    // Get all x-bind related attributes and update according to the expression provided
    walk(hostElement, (element) => {
      let xDataAttr = getXAttributes(element, "data");
      // If xDataAttr is present, it means there is a nested x-data so we need to create a new component instance
      // for the element, and we want to push the component to $children array of the component
      // And parent component no longer walks inside child component elements, it stops walking inside the tree
      // and goes to next sibling, it is now responsibility of child component to handle its element's updates
      if (element !== hostElement && xDataAttr.length) {
        if (!element._x__component) {
          let child = new Component(element);
          this.$children.push(child);
        }
        // This return statement means the the children of this element will not be walked, and next sibling will be targeted
        return { ignoreChildren: true };
      }

      // If it is not another x-data component, we look for bind attributes and handle them
      let attrTypes = getXAttributes(element, "bind");
      if (attrTypes.length == 0) return;
      attrTypes.forEach((attrType) =>
        this.handleBindAttributes(element, attrType, { modifiedProps })
      );
    });
  }

  shouldEvaluateExpression(modifiedProps, expression, element) {
    // todo: remove this and solve for x-for update
    if (!this.$startProxyUpdate) return true;
    let truth = modifiedProps.some(
      (prop) =>
        // todo: element._x__for_expression check remove and from handleFor.js as well
        expression.includes(prop) || element._x__for_expression?.includes(prop)
    );
    return truth;
  }

  handleBindAttributes(element, attrType, { modifiedProps } = data) {
    let expression = element.getAttribute(attrType);
    if (!this.shouldEvaluateExpression(modifiedProps, expression, element))
      return;

    let attr = getXBindType(attrType);
    let commonObj = {
      element,
      expression,
      self: this,
    };

    handleAttributeByType(attr, commonObj);
  }

  registerEvents({ delegateTo }) {
    // List out all the possible events that would occur in the html and add listener only on root element, called event delegation
    let xOnAttrs = [];
    walk(this.$el, (element) => {
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

    xOnAttrs.forEach((type) => handleListener(type, { delegateTo }));
  }
}

let element = document.querySelector("[x-data]");
new Component(element);
