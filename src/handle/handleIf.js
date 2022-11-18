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
  walk(requiredElement, (elem) => {
    // Now all the element added should have their _x__data array for evaluating
    if (getXAttributes(elem).length) {
      appendXDataToElement(elem, self.$state);
    }
  });

  element.__x_sibling = requiredElement;
  element.after(requiredElement);
}
