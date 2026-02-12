document.getElementById("saveButton").addEventListener("click", async () => {
    const word = document.getElementById("word").value;
    const meaning = document.getElementById("meaning").value;
    const sentence = document.getElementById("sentence").value;

    const res = await fetch("http://localhost:7071/api/saveVocab", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            word,
            meaning,
            sentence
        })
    });

    const data = await res.json();
    document.getElementById("result").innerText = data.message || "saved";

    loadVocabs();
});

async function loadVocabs() {
    const res = await fetch("http://localhost:7071/api/getVocabs");
    const data = await res.json();

    const tbody = document.querySelector("#vocabTable tbody");
    tbody.innerHTML = "";

    data.forEach(v => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${v.word}</td>
            <td>${v.meaning || ""}</td>
            <td>${v.sentence || ""}</td>
            <td>
                <button onclick="deleteVocab('${v.id}')">🗑️</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

async function deleteVocab(id) {
    await fetch(`http://localhost:7071/api/deleteVocab?id=${id}`, {
        method: "DELETE"
    });

    loadVocabs();
}

loadVocabs();