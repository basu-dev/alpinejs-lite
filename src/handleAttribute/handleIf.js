import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  getXData,
  walk,
} from "../helper.js";

export function handleIf({ element, expression, self, modifiedProps }) {
  // We will get the first child from template
  let _template = element.content.cloneNode(true);
  let requiredElement = _template.children[0];

  let expressionIsTrue = evalString(expression, element._x__data);

  // if expression return false and element is already added we  remove the element

  if (!expressionIsTrue && element.__x_sibling) {
    cleanupPreviouslyAddedElementXIf(element);
    return;
  }
  // if expression is false and sibling element is not added we simply return
  if (!expressionIsTrue) return;

  // If expression is true and sibling element is already added we do nothing
  if (expressionIsTrue && element.__x_sibling) {
    return;
  }

  // If the expression results true and sibling element is not added yet,
  //  we add the element after template tag and set__x_sibling as the added element,
  // so that we can remove that later ( done in first case above )

  walk(requiredElement, (elem) => {
    // Now all the element added should have their _x__data array for evaluating
    if (getXAttributes(elem).length) {
      getXData(element).forEach((d) => appendXDataToElement(elem, d));
    }

    // This is for x-if inside x-for we are using _x__for_expression for evalString.
    // This term is also referenced in handleAttributes.js and handleFor.js
    if (element._x__for_expression) {
      elem._x__for_expression = element._x__for_expression;
    }
  });

  element.__x_sibling = requiredElement;
  element.after(requiredElement);
}

export function cleanupPreviouslyAddedElementXIf(templateElement) {
  templateElement.__x_sibling.remove();
  templateElement.__x_sibling = null;
}
