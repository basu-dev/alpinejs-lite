import { handleFor } from "./handleFor.js";
import { evalString } from "./helper.js";

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

function handleIf({ element, expression }) {
  // We will get the first child from template
  let _template = element.content.cloneNode(true);
  let requiredElement = _template.children[0];

  // We will check if the element is already added after template tag,
  // if  element is already we remove and check the expression to be true or not
  if (element.__x_sibling) {
    element.__x_sibling.remove();
    element.__x_sibling = null;
  }
  let truth = evalString(expression, element._x__data);
  // If the expression results true, we add the element after template tag and set
  // __x_sibling as the added element, so that we can remove that later ( like done in above lines)

  if (!truth) return;
  element.__x_sibling = requiredElement;
  element.after(requiredElement);
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
