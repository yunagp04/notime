// backend/public/js/listDetail.js
// Page for viewing and managing a specific list

const urlParams = new URLSearchParams(window.location.search);
const listId = urlParams.get("id");

async function loadList() {
  try {
    const res = await fetch(`/api/lists/${listId}`);
    const words = await res.json();
    const container = document.getElementById("wordContainer");
    container.innerHTML = "";

    words.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" value="${item.learning_item_id}" class="word-checkbox"></td>
        <td><strong>${item.title || 'N/A'}</strong></td>
        <td>${item.content || 'ไม่มีความหมาย'}</td>
        <td>
          <button onclick="generateSingleAI('${item.learning_item_id}', '${item.title}')">🪄 Gen</button>
        </td>
      `;
  container.appendChild(row);
});
    // words.forEach(item => {
    //   const row = document.createElement("tr");
    //   row.innerHTML = `
    //     <td><input type="checkbox" value="${item.learning_item_id}" class="word-checkbox"></td>
    //     <td><strong>${item.title || 'N/A'}</strong></td>
    //     <td>${item.content || 'ไม่มีความหมาย'}</td>
    //   `;
    //   container.appendChild(row);
    // });
  } catch (err) { console.error("Load list error:", err); }
}

async function generateWithAI(itemId, word) {
  try {
    const res = await fetch(`/api/vocabs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, word })
    });
    if (res.ok) {
      alert("AI เจนความหมายให้แล้ว!");
      loadList(); // Refresh หน้าจอ
    }
  } catch (err) {
    alert("AI Error: " + err.message);
  }
}

// ฟังก์ชันลบที่ทำงานได้จริง
async function deleteSelected() {
  const checkboxes = document.querySelectorAll(".word-checkbox:checked");
  const itemIds = Array.from(checkboxes).map(cb => cb.value);

  if (itemIds.length === 0) return alert("กรุณาเลือกคำที่ต้องการลบ");
  if (!confirm(`ลบคำศัพท์ ${itemIds.length} รายการ?`)) return;

  const res = await fetch(`/api/lists/${listId}/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds })
  });

  if (res.ok) {
    alert("ลบสำเร็จ");
    loadList();
  }
}

document.addEventListener("DOMContentLoaded", loadList);

async function addWordToCurrentList() {
  // แก้ไข: ดึงค่าจาก ID ให้ตรงกับหน้า HTML
  const wordInput = document.getElementById("newWord");
  const meaningInput = document.getElementById("newMeaning");
  
  if (!wordInput) return alert("หาช่องกรอกคำศัพท์ไม่เจอ");

  const word = wordInput.value;
  const meaning = meaningInput.value;

  if (!word) return alert("กรุณาใส่คำศัพท์");

  try {
    const res = await fetch(`/api/lists/${listId}/add-word`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, meaning })
    });

    if (res.ok) {
      alert("เพิ่มสำเร็จ!");
      wordInput.value = ""; // ล้างช่อง
      meaningInput.value = "";
      loadList(); // โหลดตารางใหม่
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  } catch (err) { alert("Failed to add word"); }
}

// 2. ฟังก์ชัน AI Generate แบบทีละคำ (ปุ่มเวทมนตร์ข้างแถว)
async function generateSingleAI(itemId, word) {
  try {
    const res = await fetch(`/api/lists/${listId}/words/${itemId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });
    if (res.ok) {
      loadList();
    }
  } catch (err) { alert("AI Error"); }
}

// 3. ฟังก์ชัน AI Generate แบบรวม (Batch) ตามที่คุณเคยทำได้
async function generateMeanings() {
    const btn = document.getElementById("genBtn");
    btn.disabled = true;
    btn.innerText = "Generating...";

    try {
        const res = await fetch("/api/generate/generate", { method: "POST" });
        const data = await res.json();
        alert(data.message);
        loadList();
    } catch (err) {
        alert("Generate failed");
    } finally {
        btn.disabled = false;
        btn.innerText = "AI Generate All";
    }
}

function goBackToLists() {
  window.location.href = "/";
}

// Select all/deselect all functionality
function toggleAllCheckboxes(source) {
  const checkboxes = document.querySelectorAll("input[type='checkbox'].word-checkbox");
  checkboxes.forEach(cb => {
    cb.checked = source.checked;
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", loadList);
