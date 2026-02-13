let editId = null;

const API_URL = "https://notime-dev-crg8ckdnfxaqd8fc.koreacentral-01.azurewebsites.net/api";

function editVocab(id, title, content) {
    document.getElementById("title").value = title;
    document.getElementById("content").value = content;
    editId = id;
    document.getElementById("saveButton").innerText = "Update";
}

document.getElementById("saveButton").addEventListener("click", async () => {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    // const language = document.getElementById("language").value;

    if (editId) {
        await fetch(`${API_URL}/updateVocab`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editId, title, content }),
            credentials: 'include'
        });
        editId = null;
        document.getElementById("saveButton").innerText = "save";
    } else {
        const res = await fetch(`${API_URL}/saveVocab`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                content,
                language: 'en'
            }),
            credentials: 'include'
        });
    }

    // const data = await res.json();
    // document.getElementById("result").innerText = data.message || "saved";
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    loadVocabs();
});

async function loadVocabs() {
    const res = await fetch(`${API_URL}/getVocabs`, {
        credentials: 'include'
    });
    const data = await res.json();

    const tbody = document.getElementById("vocabTableBody");
    tbody.innerHTML = "";

    data.forEach(v => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${v.title}</td>
            <td>${v.content || ""}</td>
            <td>${v.language || ""}</td>
            <td>
                <button onclick="editVocab('${v.id}', '${v.title}', '${v.content}')">✏️</button>
                <button onclick="deleteVocab('${v.id}')">🗑️</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

async function deleteVocab(id) {
    await fetch(`${API_URL}/deleteVocab?id=${id}`, {
        method: "DELETE",
        credentials: 'include'
    });

    loadVocabs();
}

loadVocabs();