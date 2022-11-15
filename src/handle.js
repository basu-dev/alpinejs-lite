import { evalString } from "./helper.js";

export function handleValue({ element, expression, data, modifiedProps }) {
  element.value = evalString(expression, data);
}

export function handleText({ element, expression, data }) {
  element.innerText = evalString(expression, data);
}

export function handleHtml({ element, expression, data, modifiedProps }) {
  element.innerHTML = evalString(expression, data);
}

export function handleBooleanAttributes({ attr, element, expression, data }) {
  element[attr] = evalString(expression, data);
}

export function handleBindings({ attr, element, expression, data }) {
  console.log("here", attr, element, expression);
  element[attr] = evalString(expression, data);
}

export function handleClass({ element, expression, data }) {
  let reflectAttr = "x-class-reflect";
  let className = evalString(expression, data);
  if (className.length) {
    element.classList.add(className);
    element.setAttribute(reflectAttr, className);
  } else {
    let appliedClass = element.getAttribute(reflectAttr);
    if (appliedClass) element.classList.remove(appliedClass);
    element.removeAttribute(reflectAttr);
  }
}
