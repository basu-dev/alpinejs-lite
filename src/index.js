"use strict";
const todoComponent = () => ({
  name: "",
  incompleteTodos: [],
  completedTodos: [],
  init() {
    fetch("https://dummyjson.com/todos")
      .then((data) => data.json())
      .then((data) => {
        data.todos.length = 5;
        this.incompleteTodos = data.todos.map((todo) => todo.todo);
      })
      .catch();
  },
  addTodo() {
    if (this.name.length < 1) return;
    this.incompleteTodos = [...this.incompleteTodos, this.name];
    this.name = "";
  },

  markDone(index) {
    if (index == -1) return;
    setTimeout(() => {
      let todo = this.incompleteTodos.splice(index, 1);
      this.incompleteTodos = [...this.incompleteTodos];
      this.completedTodos = [...this.completedTodos, ...todo];
    }, 300);
  },
  removeTodo(index) {
    setTimeout(() => {
      this.completedTodos.splice(index, 1);
      this.completedTodos = [...this.completedTodos];
    }, 300);
  },
  indices: [1, 3, 5],
});
const imageComponent = () => ({
  imageWidth: "",
  loadingImage: false,
  src: "https://picsum.photos/534/225.webp",
  init() {
    this.$refs.image.addEventListener("load", () => {
      this.loadingImage = false;
    });
  },
  changeImage() {
    let height = Math.floor(Math.random() * (500 - 300 + 1) + 300);
    let width = Math.floor((19 / 8) * height);
    this.src = `https://picsum.photos/${width}/${height}.webp`;
    this.loadingImage = true;
  },
});

document.addEventListener("alpine:init", () => {
  Alpine.data("todoComponent", () => todoComponent());
  Alpine.data("imageComponent", () => imageComponent());
});
