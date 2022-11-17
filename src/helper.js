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
  cb(el);
  let nextElement = el.firstElementChild;
  while (nextElement) {
    walk(nextElement, cb);
    nextElement = nextElement.nextElementSibling;
  }
}

export const getXAttributes = (el, type) =>
  el.getAttributeNames().filter((attr) => attr.includes(`x-${type}`));

export const getXBindType = (bindType) => bindType.split(":")[1];

export const appendXDataToElement = (element, data) => {
  if (element._x__data) {
    element._x__data.push(data);
  } else {
    element._x__data = [data];
  }
};

export const getXData = (element) => (element._x__data ? element._x__data : []);
