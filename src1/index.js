/*
# 1. Look for all the elements in dom having x-data attribute and initialize component for each element
# 2. Parse the data provided as string to x-data attribute and convert it to object ( Most crucial part)
3. Update the Dom with the data state
4. Listen for events in the DOM tree
*/
import { evalString } from "./helper.js";

class Component {
  constructor(element) {
    this.el = element;
    let dataInStrint = this.el.getAttribute("x-data");
    this.data = evalString(dataInStrint);
    this.updateDom();
  }

  walk(el, cb) {
    cb(el);
    let nextElement = el.firstElementChild;
    let siblingElement = el.nextElementSibling;
    if (nextElement) {
      this.walk(nextElement, cb);
    }
    if (siblingElement) {
      this.walk(siblingElement, cb);
    }
  }

  updateDom() {
    this.walk(this.el, (el) => console.log(el));
  }
}

document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
