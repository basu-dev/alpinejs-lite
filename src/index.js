import { Component } from "./component.js";

export const Alpine = {
  init: () => {
    document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
  },
};

Alpine.init();
