import { evalString } from "./helper.js";

/**
 * for form value
 * ```html
 * <input x-bind:value="myValue"/>
 * ```
 */
export function handleValue({ element, expression, data }) {
  element.value = evalString(expression, data);
}

/**
 * for something like
 * ```html
 * <div x-bind:text="myName"></div>
 * ```
 */
export function handleText({ element, expression, data }) {
  element.innerText = evalString(expression, data);
}

/**
 * for something like
 * ```html
 *<div x-bind:html="myHtml"></div>
 * ```
 */
export function handleHtml({ element, expression, data }) {
  element.innerHTML = evalString(expression, data);
}

/**
 * for something like
 * ```html
 * <button x-bind:disabled="isBtnDisabled" x-bind:checked="false"></button>
 * <input type="checkbox" x-bind:check="isChecked"/>
 * ```
 */
export function handleBooleanAttributes({ attr, element, expression, data }) {
  element[attr] = evalString(expression, data);
}

/**
 * for something like
 * ```html
 *<img x-bind:src="'/assets/carrot.jpg'" x-bind:id="id" />
 * ```
 */
export function handleBindings({ attr, element, expression, data }) {
  element[attr] = evalString(expression, data);
}

/**
 * for something like
 * ```html
 *<div x-bind:class="applyOneClass?'one-class':'another-class'"></div>
 * ```
 */
export function handleClass({ element, expression, data }) {
  let reflectAttr = "x-class-reflect";
  let className = evalString(expression, data);
  if (className.length) {
    element.classList.add(className);
    element.setAttribute(reflectAttr, className);
  } else {
    let appliedClass = element.getAttribute(reflectAttr);
    if (appliedClass) element.classList.remove(appliedClass);
    element.removeAttribute(reflectAttr);
  }
}
