"use strict";
import { evalString, getXBindType, getXType } from "../helper.js";
import { booleanAttributes } from "./attributeList.js";
import { handleFor } from "./handleFor.js";
import { handleIf } from "./handleIf.js";

export function handleAttributes(
  self,
  { element, attribute, modifiedProps } = data
) {
  let expression = element.getAttribute(attribute);

  if (
    !shouldEvaluateExpression(self, {
      modifiedProps,
      expression,
      element,
      attribute,
    })
  )
    return;

  let attr = getXType(attribute);
  let commonObj = { element, expression, self, attr, modifiedProps };
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

  // This marks that if the element is updated once, only prop change can update the element,
  // if not element will be updated. This is useful for elements added by x-if, the elements are not updated
  // once but $startProxyUpdate is already true by then, and the element will not be updated until prop changes again
  // Used inside shouldEvaluateExpression function
  element._x_updated_once = true;
}

function handleBindAttribute({ element, expression, self, attribute }) {
  let attr = getXBindType(attribute);
  let commonObj = { element, expression, self, attr };

  if (booleanAttributes.includes(attr)) {
    handleBooleanAttributes(commonObj);
    return;
  }

  switch (attr) {
    case "text":
      handleText(commonObj);
      break;
    case "class":
      handleClass(commonObj);
      break;
    case "value":
      // Value doesn't have one to one mapping between element's "value attribute" and element's "value property"
      // so we have to handle it differently
      handleValue(commonObj);
      break;
    default:
      handleNonBooleanAttributes(commonObj);
  }
}

function shouldEvaluateExpression(
  self,
  { modifiedProps, expression, element, attribute } = data
) {
  // For x:on and x-reflect-class,x-ref we do nothing
  if (
    ["x-on", "x-class-reflect", "x-ref"].some((text) =>
      attribute.includes(text)
    )
  ) {
    return false;
  }

  // todo: remove this and solve for x-for update
  if (!self.$startProxyUpdate) return true;

  // if startProxyUpdate is true, but element is not even updated once, it should be updated
  if (self.$startProxyUpdate && !element._x_updated_once) return true;

  let truth = modifiedProps
    .map((prop) => prop.name)
    .some(
      (prop) =>
        // todo: element._x__for_expression check remove and from handleFor.js as well
        expression.includes(prop) || element._x__for_expression?.includes(prop)
    );
  return truth;
}

function handleText({ element, expression }) {
  element.innerText = evalString(expression, element._x__data);
}

function handleHtml({ element, expression }) {
  element.innerHTML = evalString(expression, element._x__data);
}

function handleValue({ attr, element, expression }) {
  element[attr] = evalString(expression, element._x__data);
}

function handleBooleanAttributes({ attr, element, expression }) {
  element[attr] = evalString(expression, element._x__data);
}

function handleNonBooleanAttributes({ attr, element, expression }) {
  element.setAttribute(attr, evalString(expression, element._x__data));
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
