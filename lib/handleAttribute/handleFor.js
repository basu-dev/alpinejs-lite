"use strict";
import {
  appendXDataToElement,
  evalString,
  getXAttributes,
  getXData,
  walk,
} from "../helper.js";
import { cleanupPreviouslyAddedElementXIf } from "./handleIf.js";

export function handleFor({ self, element, expression }) {
  // We will get the first child from template
  let _template = element.content;

  // We will check if the element is already added after template tag,
  // if  element is already we remove and check the expression to be true or not
  cleanupPreviousAddedElementsXFor(element);

  // split expression by 'in'
  let [itemLabel, collectionLabel] = expression.split(" in ");

  // Get collection from collectionLabel
  let collection = evalString(collectionLabel, element._x__data);

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
      // todo: find another solution for this also in shouldEvaluateExpression() method in index.js page
      // this concatenating with + " " + is for nested x-for
      elem._x__for_expression = element._x__for_expression + " " + expression;
    }
  });
  return requiredElement;
}

function cleanupPreviousAddedElementsXFor(element) {
  if (element.__x_siblings && element.__x_siblings.length) {
    element.__x_siblings.forEach((siblingElement) => {
      // If sibling element is x-for or x-template we need to remove their sibling elements as well
      if (siblingElement instanceof HTMLTemplateElement) {
        if (siblingElement.getAttribute("x-for")) {
          // this means this is x-for template
          cleanupPreviousAddedElementsXFor(siblingElement);
        } else if (siblingElement.getAttribute("x-if")) {
          // this means this is x-for template
          cleanupPreviouslyAddedElementXIf(siblingElement);
        }
      }
      siblingElement.remove();
    });
    element.__x_siblings.length = 0;
  }
}
