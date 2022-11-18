import { evalString } from "../helper.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";

export function handleAttributeByType(attr, { element, expression, self }) {
  let commonObj = { element, expression, self };
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

function handleValue({ element, expression }) {
  element.value = evalString(expression, element._x__data);
}

function handleText({ element, expression }) {
  element.innerText = evalString(expression, element._x__data);
}

function handleHtml({ element, expression }) {
  element.innerHTML = evalString(expression, element._x__data);
}

function handleBooleanAttributes({ attr, element, expression }) {
  element[attr] = evalString(expression, element._x__data);
}

function handleBindings({ attr, element, expression }) {
  element[attr] = evalString(expression, element._x__data);
}

function handleClass({ element, expression }) {
  let reflectAttr = "x-class-reflect";
  let className = evalString(expression, element._x__data);
  // If className is returned by expression we add that class to the element's classList
  // and add x-class-reflect attribute with same className (like in if case below)
  // so that we can remove that class at the time when expression returns empty or nothing, (like in else case below)
  if (className.length) {
    element.classList.add(className);
    element.setAttribute(reflectAttr, className);
  } else {
    let appliedClass = element.getAttribute(reflectAttr);
    if (appliedClass) element.classList.remove(appliedClass);
    element.removeAttribute(reflectAttr);
  }
}
