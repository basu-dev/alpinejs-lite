"use strict";
export const evalString = (expression, dataList = [{}], extras = {}) => {
  return new Function(
    dataList.map((_, index) => `$_data_${index}`),
    ...Object.keys(extras),
    `${dataList
      .map((_, index) => `with($_data_${index}) `)
      .join("")} return ${expression}`
  )(...dataList, ...Object.values(extras));
};

export function walk(el, cb) {
  let action = cb(el);
  // if user wants to not walk the children and go directly to siblings, he has to return {ignoreChildren:true}
  // this is used as one component should not walk down inside another component's nodes
  let nextElement;
  if (action && action.ignoreChildren) {
    nextElement = el.nextElementSibling;
  } else {
    nextElement = el.firstElementChild;
  }

  while (nextElement) {
    walk(nextElement, cb);
    nextElement = nextElement.nextElementSibling;
  }
}

export const getXAttributes = (el, type = "") =>
  el.getAttributeNames().filter((attr) => attr.includes(`x-${type}`));

export const getXBindType = (bindType) => bindType.split(":")[1];

export const getXType = (attribute) => {
  let type = attribute.split("-")[1];
  if (type.includes("bind")) return "bind";
  return type;
};

export const appendXDataToElement = (element, data) => {
  if (element._x__data) {
    element._x__data.push(data);
  } else {
    element._x__data = [data];
  }
};

export const getXData = (element) => (element._x__data ? element._x__data : []);
