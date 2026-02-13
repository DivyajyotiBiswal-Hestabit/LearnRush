// SELECTORS 
const taskInput = document.querySelector(".todo-input textarea");
const addBtn = document.querySelector(".todo-input button");
const saveListBtn = document.getElementById("saveListBtn");
const todoList = document.querySelector(".todo-list");
const recentList = document.querySelector(".recent-work ul");
const searchInput = document.querySelector(".searchbar input");

const stickyInput = document.querySelector(".sticky-input input");
const stickyAddBtn = document.querySelector(".sticky-input button");
const stickyContainer = document.querySelector(".sticky-container");

// DATA 
let currentTasks = [];
let allLists = JSON.parse(localStorage.getItem("allLists")) || [];
let stickyNotes = JSON.parse(localStorage.getItem("stickyNotes")) || [];

// ADD TASK 
addBtn.addEventListener("click", addTask);

function addTask() {
  const text = taskInput.value.trim();
  if (text === "") return;

  currentTasks.push(text);
  renderTasks();
  taskInput.value = "";
}

// RENDER TASKS
function renderTasks() {
  todoList.innerHTML = "";

  currentTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.innerHTML = task.replace(/\n/g, "<br>");

    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = " ❌";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.float = "right";

    deleteBtn.onclick = () => {
      currentTasks.splice(index, 1);
      renderTasks();
    };

    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

// SAVE LIST 
saveListBtn.addEventListener("click", () => {
  if (currentTasks.length === 0) {
    alert("Add some tasks first!");
    return;
  }

  const listName = prompt("Enter a name for this list:");
  if (!listName) return;

  const newList = {
    name: listName,
    tasks: [...currentTasks]
  };

  allLists.push(newList);
  localStorage.setItem("allLists", JSON.stringify(allLists));

  renderRecentLists();

  currentTasks = [];
  renderTasks();
});

// RECENT LISTS
function renderRecentLists() {
  recentList.innerHTML = "";

  allLists.forEach((list) => {
    const li = document.createElement("li");
    li.textContent = list.name;

    li.onclick = () => {
      currentTasks = [...list.tasks];
      renderTasks();
    };

    recentList.appendChild(li);
  });
}

//SEARCH
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const items = todoList.querySelectorAll("li");

  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(value) ? "block" : "none";
  });
});

//STICKY WALL
stickyAddBtn.addEventListener("click", addStickyNote);

function addStickyNote() {
  const text = stickyInput.value.trim();
  if (text === "") return;

  stickyNotes.push(text);
  localStorage.setItem("stickyNotes", JSON.stringify(stickyNotes));

  stickyInput.value = "";
  renderStickyNotes();
}

function renderStickyNotes() {
  stickyContainer.innerHTML = "";

  stickyNotes.forEach((note, index) => {
    const div = document.createElement("div");
    div.className = "sticky-note";
    div.textContent = note;

    // Delete on click
    div.onclick = () => {
      stickyNotes.splice(index, 1);
      localStorage.setItem("stickyNotes", JSON.stringify(stickyNotes));
      renderStickyNotes();
    };

    stickyContainer.appendChild(div);
  });
}
renderRecentLists();
renderStickyNotes();

