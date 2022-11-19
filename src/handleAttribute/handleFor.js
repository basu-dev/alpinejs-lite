import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  getXData,
  walk,
} from "../helper.js";

export function handleFor({ self, element, expression }) {
  // We will get the first child from template
  let _template = element.content;

  // We will check if the element is already added after template tag,
  // if  element is already we remove and check the expression to be true or not
  cleanupPreviousAddedElements(element);

  // split expression by 'in'
  let [itemLabel, collectionLabel] = expression.split(" in ");

  // Get collection from collectionLabel
  let collection = evalString(collectionLabel, element._x__data);
  console.log(collection);

  let childNodes = collection.map((item, index) =>
    createSingleNode(self, element, _template, itemLabel, item, expression)
  );

  childNodes.reverse().forEach((childNode) => element.after(childNode));
}

function createSingleNode(
  self,
  element,
  _template,
  singleItemLabel,
  singleItem,
  expression
) {
  let requiredElement = _template.cloneNode(true).children[0];

  if (element.__x_siblings) {
    element.__x_siblings.push(requiredElement);
  } else {
    element.__x_siblings = [requiredElement];
  }

  // This property makes sure that the added element is not updated by global updateNodeBindings method
  // It would cause error as the scope variable of loop is not present in global scope
  let xForScope = {};
  xForScope[`${singleItemLabel}`] = singleItem;
  walk(requiredElement, (elem) => {
    // Now the element will have two states to one from scope of x-for loop another global scope
    if (getXAttributes(elem).length) {
      getXData(element).forEach((d) => appendXDataToElement(elem, d));

      appendXDataToElement(elem, xForScope);
      // console.log(elem, getXData(elem));
      // todo: find another solution for this also in shouldEvaluateExpression() method in index.js page
      // this concatenating with + " " + is for nested x-for
      elem._x__for_expression = element._x__for_expression + " " + expression;
    }
  });
  return requiredElement;
}

function cleanupPreviousAddedElements(element) {
  if (element.__x_siblings && element.__x_siblings.length) {
    element.__x_siblings.forEach((item) => item.remove());
    element.__x_siblings.length = 0;
  }
}
