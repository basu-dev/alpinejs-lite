/**
 * This function is used in parsing all the JavaScript expressions added by developer in html attributes
 *
 * Example of how it works
 * ```ts
 * let data = { name:'Hello'};
 * let expression = "console.log(name)"
 * evalString(expression,data); // logs 'Dev' to the console
 * evalString("name='World'",data) // mutates original data
 * console.log(data.name); // gives 'World' not 'Hello'
 * ```
 * In one of our use case, lets say we have html like
 *
 * ```html
 * <div x-data="{name:'Hello'}">
 *    <div x-bind:text='name'>
 * </div>
 * ```
 *
 * What we do in our js file is we get that expression in the form of string from x-data attribute and convert it to
 * valid JavsScript object
 *
 * ```ts
 * let dataInStringForm = element.getAttribute(x-data); // return "{name:'Hello'}" string. PS this code is used in Component constructor
 * this.$data = evalString(dataInStringForm,{});// return {name:'Hello'} as valid JavaScript object
 * ```
 */
export const evalString = (expression, data, event) =>
  new Function("data", "$event", `with(data) return ${expression}`)(
    data,
    event
  );

/** Walks through all DOM nodes and performs cb on each element */
export function walk(el, cb) {
  cb(el);
  let nextElement = el.firstElementChild;
  while (nextElement) {
    walk(nextElement, cb);
    nextElement = nextElement.nextElementSibling;
  }
}

/** if input is (element,'bind') it returns ["x-bind:on","x-bind:html"] like array if the element has those attributes */
export const getXAttributes = (el, type) =>
  el.getAttributeNames().filter((attr) => attr.includes(`x-${type}`));

/** If input is "x-bind:text" , it return 'text' by splitting out x-bind:*/
export const getXBindType = (bindType) => bindType.split(":")[1];
