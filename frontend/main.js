// frontend/main.js

let editId = null;

// const API_URL = "https://notime-dev-crg8ckdnfxaqd8fc.koreacentral-01.azurewebsites.net/api";
const API_URL = "/api";
// const API_URL =
//   window.location.hostname === "localhost"
//     ? "/api"
//     : "/api";

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
      await fetch(`${API_URL}/updateVocab`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, title, content }),
        credentials: "include",
      });

      editId = null;
      document.getElementById("saveButton").innerText = "Save";
    } else {
      await fetch(`${API_URL}/saveVocab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          language: "en",
        }),
        credentials: "include",
      });
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
    const res = await fetch(`${API_URL}/getVocabs`, {
      credentials: "include",
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
      editBtn.textContent = "✏️";
      editBtn.onclick = () =>
        editVocab(v.id, v.title, v.content);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
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
    console.error(err);
    alert("Failed to load data");
  }
}

async function deleteVocab(id) {
  if (!confirm("Delete this item?")) return;

  await fetch(`${API_URL}/deleteVocab?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  loadVocabs();
}

loadVocabs();
