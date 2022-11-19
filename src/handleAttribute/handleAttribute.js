import { evalString, getXBindType, getXType } from "../helper.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";

export function handleAttributes(
  self,
  { element, attribute, modifiedProps } = data
) {
  let expression = element.getAttribute(attribute);

  if (!shouldEvaluateExpression(self, { modifiedProps, expression, element }))
    return;

  let attr = getXType(attribute);
  let commonObj = { element, expression, self, attr };
  switch (attr) {
    case "bind":
      handleBindAttribute({ element, expression, self, attribute });
      break;
    case "text":
      handleText(commonObj);
      break;
    case "html":
      handleHtml(commonObj);
      break;
    case "if":
      handleIf(commonObj);
      break;
    case "for":
      handleFor(commonObj);
      break;
    case "show":
      handleShow(commonObj);
      break;
  }
}

function handleBindAttribute({ element, expression, self, attribute }) {
  let attr = getXBindType(attribute);
  let commonObj = { element, expression, self, attr };
  switch (attr) {
    case "disabled":
    case "checked":
      handleBooleanAttributes(commonObj);
      break;
    case "src":
      handleBindings(commonObj);
      break;
    case "value":
      handleValue(commonObj);
      break;
    case "text":
      handleText(commonObj);
      break;
    case "class":
      handleClass(commonObj);
      break;
  }
}

function shouldEvaluateExpression(
  self,
  { modifiedProps, expression, element } = data
) {
  // todo: remove this and solve for x-for update
  if (!self.$startProxyUpdate) return true;
  let truth = modifiedProps.some(
    (prop) =>
      // todo: element._x__for_expression check remove and from handleFor.js as well
      expression.includes(prop) || element._x__for_expression?.includes(prop)
  );
  return truth;
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

function handleShow({ element, expression }) {
  let expressionIsTrue = evalString(expression, element._x__data);
  if (expressionIsTrue) {
    element.style.removeProperty("display");
  } else {
    element.style.setProperty("display", "none");
  }
}
