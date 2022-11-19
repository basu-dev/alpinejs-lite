import { evalString, getXAttributes, getXBindType } from "./helper.js";

export function handleListener(type, { delegateTo }) {
  let eventType = getXBindType(type);
  delegateTo.addEventListener(eventType, (event) => {
    let el = event.target;
    let onAttrs = getXAttributes(el, "on");

    if (onAttrs.length == 0) return;
    if (!onAttrs.some((attr) => attr.includes(type))) return;

    let expression = el.getAttribute(type);
    evalString(expression, el._x__data, { $event: event });
  });
}
