/*
# 1. Create a new component instance for each element that has x-data attribute
# 2. Parse the data from string to object
# 3. Then we go through all the node tree looking for elements with x-bind attribute and update the node 
# 4. Look for all the events in whole node tree and delegate that event so that all event is captured
# 5. After each event we evaluate the expression inside the event handler which mutates our state data and again repeat from  step 3
*/

export function evalString(expression, scope, event) {
  return new Function(["data", "$event"], `with(data) return ${expression}`)(
    ...Object.values(scope),
    event
  );
}

export function walk(node, callback) {
  callback(node);
  let nextNode = node.firstElementChild;
  while (nextNode) {
    walk(nextNode, callback);
    nextNode = nextNode.nextElementSibling;
  }
}

export function getXAttributes(el, attrName) {
  let attrs = el
    .getAttributeNames()
    .filter((attr) => attr.includes(`x-${attrName}`));
  return attrs;
}
