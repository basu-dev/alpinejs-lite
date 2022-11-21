"use strict";
/*
# 1. Look for the element in dom having x-data attribute and initialize component for that element
# 2. Parse the data provided as string to x-data attribute and convert it to object ( Most crucial part)
3. Update the Dom with the data state
4. Listen for events in the DOM tree
*/
import { handleAttributes } from "./handleAttribute/handleAttribute.js";
import { handleXData } from "./handleAttribute/handleXData.js";
import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  walk,
} from "./helper.js";
import { handleListener } from "./registerEvents.js";

export class Component {
  constructor(el) {
    this.$el = el;
    // This _x__component is used in case this element is nested inside another x-data to determine whether
    // already a component is instantiated for this element or not.
    // Can also be used for debugging purpose
    el._x__component = this;

    let expression = this.$el.getAttribute("x-data");
    if (expression) {
      // This is Alpine.data api
      if (Object.keys(Alpine.components).includes(expression)) {
        this.$state = this.proxify(Alpine.components[expression]());
      } else {
        // This is for inline x-data component
        this.$state = this.proxify(evalString(expression));
      }
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

        let updatedProp = {
          name: prop,
          value: {
            prev: obj[prop],
            current: value,
          },
        };

        obj[prop] = value;

        // $startProxyUpdate is set to true, once all the element attributes are updated with initial state,
        // then updating of nodes is done through here
        if (self.$startProxyUpdate) {
          props.push(updatedProp);

          // This queueMicrotask is used so that if two props are changed by one action, two updateNodeBindings
          // method is not called we collect all the props that are changed and fire updateNodeBindings method
          // with array of those props
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
    this.$state.$refs = [];

    // Now we add current state to all element's _x__data array which will be used as scope when evaluating
    // the expression in the element
    walk(this.$el, (element) => {
      let xAttrs = getXAttributes(element);

      if (xAttrs.length == 0) return;

      this.checkXRef(element, xAttrs);
      appendXDataToElement(element, this.$state);
    });

    // Call init method if provided
    if (this.$state.init && typeof this.$state.init == "function") {
      this.$state.init();
    }
  }

  checkXRef(element, xAttrs) {
    if (xAttrs.includes("x-ref")) {
      this.$state.$refs[element.getAttribute("x-ref")] = element;
    }
  }

  updateNodeBindings({ hostElement } = data, modifiedProps = []) {
    // Get all x-bind related attributes and update according to the expression provided
    walk(hostElement, (element) => {
      let xAttributes = getXAttributes(element);
      if (xAttributes.length == 0) return;
      xAttributes.forEach((attribute) =>
        handleAttributes(this, { element, attribute, modifiedProps })
      );

      let xDataAttr = getXAttributes(element, "data");
      // if the element contains x-data attribute, it means

      let data = handleXData({ self: this, hostElement, element, xDataAttr });
      if (data) return data;
    });
  }

  registerEvents({ delegateTo }) {
    let eventNames = [];

    // This function walks through all elements recursively including the element inside template tag
    // and populates eventnames array with all x-on:{event} attributes
    function lookUpEvents(node, eventNames) {
      walk(node, (element) => {
        let onAttrs = getXAttributes(element, "on");
        eventNames.push(...onAttrs);

        // if the element consists x-data attribute, we only register its x-on:{event} attribute, and don't parse
        // down its children that's why we return {ignoreChildren: true}
        let xDataAttr = getXAttributes(element, "data");
        if (node !== element && xDataAttr.length) {
          return { ignoreChildren: true };
        }

        // if the element is <template> element we need to find all x-on:{event} attributes inside its element
        if (element instanceof HTMLTemplateElement) {
          let templateContentElement =
            element.content.cloneNode(true).children[0];
          lookUpEvents(templateContentElement, eventNames);
        }
      });
    }

    lookUpEvents(this.$el, eventNames);

    eventNames = [...new Set(eventNames)];

    eventNames.forEach((type) => handleListener(type, { delegateTo }));
  }
}

(function () {
  window.Alpine = {
    components: {},
    data(eventName, fn) {
      this.components[eventName] = fn;
    },
  };

  let initEvent = new Event("alpine:init");
  document.dispatchEvent(initEvent);

  let element = document.querySelector("[x-data]");
  new Component(element);

  Array.from(document.querySelectorAll("[x-cloak]")).forEach((el) =>
    el.removeAttribute("x-cloak")
  );
})();
