// backend/public/main.js

let editId = null;

// const API_URL = "https://notime-dev-crg8ckdnfxaqd8fc.koreacentral-01.azurewebsites.net/api";
// const API_URL = "/api";
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8080/api"
    : "/api";

function editVocab(id, title, content) {
  document.getElementById("title").value = title;
  document.getElementById("content").value = content;
  editId = id;
  document.getElementById("saveButton").innerText = "Update";
}

document.getElementById("saveButton").addEventListener("click", async () => {
  try {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;

    if (!title) {
      alert("Title is required");
      return;
    }

    if (editId) {
      const response = await fetch(`${API_URL}/vocabs/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      await response.json();

      editId = null;
      document.getElementById("saveButton").innerText = "Save";
    } else {
      const response = await fetch(`${API_URL}/vocabs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          language: "en"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      await response.json();
    }

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";

    loadVocabs();
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
});

async function loadVocabs() {
  try {
    const res = await fetch(`${API_URL}/vocabs`, {
      // credentials: "include",
    });

    const data = await res.json();

    const tbody = document.getElementById("vocabTableBody");
    tbody.innerHTML = "";

    data.forEach((v) => {
      const row = document.createElement("tr");

      const titleCell = document.createElement("td");
      titleCell.textContent = v.title;

      const contentCell = document.createElement("td");
      contentCell.textContent = v.content || "";

      const languageCell = document.createElement("td");
      languageCell.textContent = v.language || "";

      const actionCell = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.classList.add("action-btn", "edit-btn");
      editBtn.onclick = () =>
        editVocab(v.id, v.title, v.content);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.classList.add("action-btn", "delete-btn");
      deleteBtn.onclick = () =>
        deleteVocab(v.id);

      actionCell.appendChild(editBtn);
      actionCell.appendChild(deleteBtn);

      row.appendChild(titleCell);
      row.appendChild(contentCell);
      row.appendChild(languageCell);
      row.appendChild(actionCell);

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Load err:", err);
  }
}

async function deleteVocab(id) {
  if (!confirm("Delete this item?")) return;

  await fetch(`${API_URL}/vocabs/${id}`, {
    method: "DELETE"
    // credentials: "include",
  });

  loadVocabs();
}

async function generateMeanings() {
  const btn = document.getElementById("generateBtn");

  if (btn.disabled) return;

  btn.disabled = true;
  btn.innerText = "Generating...";

  try {
    const res = await fetch(`${API_URL}/vocabs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    alert(data.message);

    loadVocabs();
  } catch (err) {
    console.error(err);
    alert("Generate failed");
  }

  btn.disabled = false;
  btn.innerText = "Generate Meanings";
}

function logout() {
  // await fetch(`${API_URL}/auth/logout`, {
  //  method: "POST"
  // });

  window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
}
loadVocabs();