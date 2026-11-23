import { authService } from "./authService.js";

const loginPage = document.querySelector("#login-page");
const databasePage = document.querySelector("#database-page");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const logoutButton = document.querySelector("#logout-button");
const promptForm = document.querySelector("#prompt-form");
const promptList = document.querySelector("#prompt-list");
const emptyMessage = document.querySelector("#empty-message");
const promptId = document.querySelector("#prompt-id");
const saveButton = document.querySelector("#save-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");

const STORAGE_KEY = "promptDatabaseEntries";
let prompts = loadPrompts();

function loadPrompts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePrompts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

function showDatabase() {
  loginPage.hidden = true;
  databasePage.hidden = false;
  renderPrompts();
}

function showLogin() {
  databasePage.hidden = true;
  loginPage.hidden = false;
  loginForm.reset();
  loginError.textContent = "";
}

function resetForm() {
  promptForm.reset();
  promptId.value = "";
  saveButton.textContent = "Add prompt";
  cancelEditButton.hidden = true;
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function renderPrompts() {
  promptList.innerHTML = prompts.map((prompt) => `
    <tr>
      <td>${escapeHtml(prompt.projectTitle)}</td>
      <td>${escapeHtml(prompt.promptTitle)}</td>
      <td>${escapeHtml(prompt.projectVersion)}</td>
      <td>${escapeHtml(prompt.promptText)}</td>
      <td>${escapeHtml(prompt.responseSummary)}</td>
      <td class="row-actions">
        <button type="button" class="edit-button" data-id="${prompt.id}">Edit</button>
        <button type="button" class="delete-button" data-id="${prompt.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  emptyMessage.hidden = prompts.length > 0;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = formData.get("email").trim();
  const password = formData.get("password");

  try {
    await authService.login(email, password);
    showDatabase();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutButton.addEventListener("click", () => {
  authService.logout();
  resetForm();
  showLogin();
});

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(promptForm);
  const entry = {
    projectTitle: formData.get("projectTitle").trim(),
    promptTitle: formData.get("promptTitle").trim(),
    projectVersion: formData.get("projectVersion").trim(),
    promptText: formData.get("promptText").trim(),
    responseSummary: formData.get("responseSummary").trim()
  };

  if (promptId.value) {
    prompts = prompts.map((prompt) =>
      prompt.id === promptId.value ? { ...prompt, ...entry } : prompt
    );
  } else {
    prompts.unshift({
      id: crypto.randomUUID(),
      ...entry
    });
  }

  savePrompts();
  resetForm();
  renderPrompts();
});

promptList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;

  if (button.classList.contains("edit-button")) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;

    promptId.value = prompt.id;
    document.querySelector("#project-title").value = prompt.projectTitle;
    document.querySelector("#prompt-title").value = prompt.promptTitle;
    document.querySelector("#project-version").value = prompt.projectVersion;
    document.querySelector("#prompt-text").value = prompt.promptText;
    document.querySelector("#response-summary").value = prompt.responseSummary;
    saveButton.textContent = "Save changes";
    cancelEditButton.hidden = false;
    promptForm.scrollIntoView({ behavior: "smooth" });
  }

  if (button.classList.contains("delete-button")) {
    prompts = prompts.filter((prompt) => prompt.id !== id);
    savePrompts();

    if (promptId.value === id) resetForm();
    renderPrompts();
  }
});

cancelEditButton.addEventListener("click", resetForm);

if (authService.isAuthenticated()) {
  showDatabase();
} else {
  showLogin();
}