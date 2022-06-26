import { Component } from "./component.js";

export const Alpine = {
  start: () => {
    document.querySelectorAll("[x-data]").forEach((el) => new Component(el));
  },
};

Alpine.start();
