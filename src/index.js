/*
## Algorithm
1. Look for all the elements in dom having x-data attribute and initialize component for each element (Done at last line of this page)
2. Parse the data provided as string to x-data attribute and convert it to JavaScript object (data state) ( Most crucial part)
3. Update the DOM with the data state
4. Look for 'x-on' attributes, collect all the possible events and add all those events on the host element (event delegation)
*/

import {
  handleBindings,
  handleBooleanAttributes,
  handleClass,
  handleHtml,
  handleText,
  handleValue,
} from "./handle.js";
import { evalString, getXAttributes, getXBindType, walk } from "./helper.js";

class Component {
  constructor(el) {
    this.$el = el;
    // Get x-data value from html tag and convert it to JavaScript object.
    this.$data = evalString(this.$el.getAttribute("x-data"), {});
    this.initialize();
    this.updateDOM();
    this.registerEvents();
  }

  initialize() {
    // Provide update api to the user in case of async data like api call, setTimeout, Promise etc.
    // this will not be needed in future with use of proxy
    this.$data.$update = this.updateDOM.bind(this);

    // Call init method if provided by user
    if (this.$data.init && typeof this.$data.init == "function") {
      this.$data.init();
    }
  }

  updateDOM() {
    // Get all x-bind related attributes and update according to the expression provided
    walk(this.$el, (element) => {
      let attrTypes = getXAttributes(element, "bind"); // returns array like ['x-bind:text','x-bind:class','x-bind:value']
      if (attrTypes.length == 0) return;

      // We will update element as evaluating the expression inside each x-bind (attrTypes)
      attrTypes.forEach((attrType) => this.handleAttributes(element, attrType));
    });
  }

  handleAttributes(element, attrType) {
    // let the element has x-bind:value="expression_here"
    let expression = element.getAttribute(attrType); // returns "expression_here" in string form
    let attr = getXBindType(attrType); // returns 'value' from "x-bind:value" by splitting text 'x-bind:value'
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

    // Here xOnAttrs will become something like ["x-on:click","x-on:input","x-on:change"]

    // Adding any future events if provided by user
    // User can provide it like this.$futureEvents = ['change'] so we have to change 'change' to "x-on:change" and add it to array
    if (this.$data.$futureEvents && Array.isArray(this.$data.$futureEvents)) {
      xOnAttrs = [
        ...xOnAttrs,
        ...this.$data.$futureEvents.map((type) => `x-on:${type}`),
      ];
    }

    // remove duplicate with new Set() like if we have two "x-on:click", we don't want to add two click event listeners on host element
    xOnAttrs = [...new Set(xOnAttrs)];

    // Here we have collected many unique x-on attributes
    xOnAttrs.forEach((type) => this.handleListener(type));
  }

  handleListener(type) {
    // type contains string like "x-on:click"
    let eventType = getXBindType(type); // return "click" after splitting "x-on:" from the "x-on:click" so we add click event listener on host element
    // Remember we do not add eventListener on each element but on host element so that events after bubbling up are captured at host element
    this.$el.addEventListener(eventType, (event) => {
      // These below 4 lines of code verify if the "click" event is coming from element having "x-on:click" attribute
      // If it is not coming from that element, we return
      let el = event.target;
      let onAttrs = getXAttributes(el, "on");

      if (onAttrs.length == 0) return;
      if (!onAttrs.some((attr) => attr.includes(type))) return;

      // Here we get the expression from target element which is clicked and evaluate it and updateDOM
      let expression = el.getAttribute(type);
      evalString(expression, this.$data, event);
      this.updateDOM();
    });
  }
}

document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
