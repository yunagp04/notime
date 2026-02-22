// backend/public/myList.js

async function loadLists() {
  try {
    const res = await fetch("/api/lists");
    const lists = await res.json();

    const container = document.getElementById("listContainer");
    container.innerHTML = "";

    lists.forEach(list => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3 onclick="goToList('${list.list_id}')" style="cursor:pointer; text-decoration:underline;">
          ${list.list_name} (${list.total_words || 0} words)
        </h3>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Load lists error:", err);
  }
}

function goToList(id) {
  window.location.href = `/list-detail.html?id=${id}`;
}

async function quickAdd() {
  const word = document.getElementById("quickWord").value;
  const meaning = document.getElementById("quickMeaning").value;

  if (!word) {
    alert("กรุณาใส่คำศัพท์");
    return;
  }

  try {
    const res = await fetch("/api/lists/default/quick-add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, meaning })
    });

    if (res.ok) {
      alert("Added!");
      document.getElementById("quickWord").value = "";
      document.getElementById("quickMeaning").value = "";
      loadLists();
    }
  } catch (err) {
    console.error("Quick add error:", err);
  }
}

async function createList() {
  const listName = prompt("กรุณาใส่ชื่อ List ใหม่:");
  if (!listName) return;

  try {
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        list_name: listName, 
        description: "Created from web" 
      }) 
    });

    if (res.ok) {
      alert("สร้าง List สำเร็จ");
      loadLists(); 
    } else {
      const errData = await res.json();
      alert("Server Error: " + errData);
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

loadLists();