// Page for viewing all lists and quick-add functionality

async function loadLists() {
  try {
    console.log("[DEBUG] Loading lists from /api/lists");
    const res = await fetch("/api/lists");
    
    console.log("[DEBUG] Response status:", res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("[ERROR] HTTP Error:", res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const lists = await res.json();
    console.log("[DEBUG] Received data:", lists);

    const container = document.getElementById("listContainer");
    container.innerHTML = "";

    if (!Array.isArray(lists)) {
      console.error("[ERROR] Expected array, got:", typeof lists, lists);
      container.innerHTML = `<div style="color: red; padding: 20px;">
        <h3>⚠️ Error: Invalid Response Format</h3>
        <p>Server returned: ${typeof lists}</p>
        <pre>${JSON.stringify(lists, null, 2)}</pre>
      </div>`;
      return;
    }

    if (lists.length === 0) {
      container.innerHTML = "<p>No lists yet. Create one to get started!</p>";
      return;
    }

    lists.forEach(list => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
        <h3 onclick="goToList('${list.list_id}')" style="cursor:pointer; text-decoration:underline; color: #0066cc;">
          ${list.list_name} 
          <span style="color: #888; font-size: 0.9em;">(${list.total_words || 0} words)</span>
        </h3>
        ${list.description ? `<p style="color: #666; margin: 5px 0;">${list.description}</p>` : ''}
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("[ERROR] Load lists failed:", err);
    const container = document.getElementById("listContainer");
    container.innerHTML = `<div style="color: darkred; padding: 20px; background-color: #ffebee; border-radius: 5px; margin: 20px 0;">
      <h3>❌ Error Loading Lists</h3>
      <p><strong>Error:</strong> ${err.message}</p>
      <p><strong>Check browser console (F12) for more details.</strong></p>
      <button onclick="location.reload()" style="padding: 10px 20px; background-color: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">Retry</button>
    </div>`;
  }
}

function goToList(id) {
  window.location.href = `/list-detail.html?id=${id}`;
}

async function quickAdd() {
  const word = document.getElementById("quickWord")?.value;
  const meaning = document.getElementById("quickMeaning")?.value;

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

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Quick Add Error Response:", res.status, errorData);
      throw new Error(`HTTP ${res.status}: ${errorData}`);
    }

    alert("Added to New Items!");
    document.getElementById("quickWord").value = "";
    document.getElementById("quickMeaning").value = "";
    loadLists();
  } catch (err) {
    console.error("Quick add error:", err);
    alert("Quick add failed: " + err.message);
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

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Create List Error Response:", res.status, errorData);
      throw new Error(`HTTP ${res.status}: ${errorData}`);
    }

    alert("สร้าง List สำเร็จ!");
    loadLists(); 
  } catch (err) {
    console.error("Create list error:", err);
    alert("Create list failed: " + err.message);
  }
}

function logout() {
  window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
}

// Initialize page
document.addEventListener("DOMContentLoaded", loadLists);
