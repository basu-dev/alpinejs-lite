export const evalString = (expression, data, event) =>
  new Function("data", "$event", `with(data) return ${expression}`)(
    data,
    event
  );

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
