import { Component } from "../index.js";

export function handleXData({ self, hostElement, element, xDataAttr } = data) {
  // If xDataAttr is present, it means there is a nested x-data so we need to create a new component instance
  // for the element, and we want to push the component to $children array of the component
  // And parent component no longer walks inside child component elements, it stops walking inside the tree
  // and goes to next sibling, it is now responsibility of child component to handle its element's updates
  if (element !== hostElement && xDataAttr.length) {
    if (!element._x__component) {
      let child = new Component(element);
      self.$children.push(child);
    }
    // This return statement means the the children of this element will not be walked, and next sibling will be targeted
    return { ignoreChildren: true };
  }
}
