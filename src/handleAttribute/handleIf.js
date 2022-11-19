import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  walk,
} from "../helper.js";

export function handleIf({ element, expression, self }) {
  // We will get the first child from template
  let _template = element.content.cloneNode(true);
  let requiredElement = _template.children[0];

  let expressionIsTrue = evalString(expression, element._x__data);

  // if expression return false and element is already added we  remove the element

  if (!expressionIsTrue && element.__x_sibling) {
    element.__x_sibling.remove();
    element.__x_sibling = null;
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
      appendXDataToElement(elem, self.$state);
    }
  });

  element.__x_sibling = requiredElement;
  element.after(requiredElement);
}
