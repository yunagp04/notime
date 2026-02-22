// backend/public/js/listDetail.js
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
          <button onclick="editVocab('${item.learning_item_id}', '${item.title}', '${item.content || ''}')">✏️ Edit</button>
        </td>
      `;
      container.appendChild(row);
    });
  } catch (err) { console.error("Load list error:", err); }
}

// ฟังก์ชันสำหรับเปิดหน้าต่างแก้ไข (Prompt)
async function editVocab(id, title, content) {
    const newTitle = prompt("แก้ไขคำศัพท์:", title);
    const newContent = prompt("แก้ไขความหมาย:", content);

    if (newTitle === null) return; // กดยกเลิก

    try {
        const response = await fetch(`/api/vocabs/${id}`, { // ใช้ Route ที่คุณมี
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle, content: newContent }),
        });

        if (response.ok) {
            alert("Update สำเร็จ!");
            loadList(); // โหลดตารางใหม่
        } else {
            alert("Update ล้มเหลว");
        }
    } catch (err) {
        console.error(err);
        alert("Error updating vocab");
    }
}

// 3. แก้ไขฟังก์ชันเจนคำทั้งหมด (Batch Generate) ให้ทำงานได้จริง
async function generateMeanings() {
    const btn = document.getElementById("genBtn");
    btn.disabled = true;
    btn.innerText = "Generating...";

    try {
        // เรียกไปที่ Endpoint เดิมที่คุณเคยทำสำเร็จ
        const res = await fetch("/api/generate/generate", { method: "POST" });
        const data = await res.json();
        alert(data.message);
        loadList(); 
    } catch (err) {
        alert("Generate failed");
    } finally {
        btn.disabled = false;
        btn.innerText = "AI Generate Meanings";
    }
}

// async function loadList() {
//   try {
//     const res = await fetch(`/api/lists/${listId}`);
//     const words = await res.json();
//     const container = document.getElementById("wordContainer");
//     container.innerHTML = "";

//     words.forEach(item => {
//       const row = document.createElement("tr");
//       row.innerHTML = `
//         <td><input type="checkbox" value="${item.learning_item_id}" class="word-checkbox"></td>
//         <td><strong>${item.title || 'N/A'}</strong></td>
//         <td>${item.content || 'ไม่มีความหมาย'}</td>
//         <td>
//           <button onclick="generateSingleAI('${item.learning_item_id}', '${item.title}')">🪄 Gen</button>
//           <button onclick="editWord('${item.learning_item_id}', '${item.title}', '${item.content || ''}')">✏️ Edit</button>
//         </td>
//       `;
//       container.appendChild(row);
//     });
//   } catch (err) { console.error("Load list error:", err); }
// }

// async function editWord(id, oldTitle, oldContent) {
//     const newTitle = prompt("แก้ไขคำศัพท์:", oldTitle);
//     const newContent = prompt("แก้ไขความหมาย:", oldContent);
    
//     // ถ้ากดยกเลิก (null) หรือไม่เปลี่ยนค่าเลย ไม่ต้องทำอะไร
//     if (newTitle === null || (newTitle === oldTitle && newContent === oldContent)) return;

//     try {
//         const res = await fetch(`/api/vocabs/${id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ title: newTitle, content: newContent })
//         });

//         if (res.ok) {
//             alert("อัปเดตสำเร็จ!");
//             loadList(); // โหลดข้อมูลใหม่มาโชว์ทันที
//         } else {
//             const errData = await res.json();
//             alert("แก้ไขไม่สำเร็จ: " + (errData.error || "Unknown error"));
//         }
//     } catch (err) {
//         console.error("Edit error:", err);
//         alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
//     }
// }

async function generateSingleAI(itemId, word) {
  try {
    const res = await fetch(`/api/lists/${listId}/words/${itemId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });
    if (res.ok) { loadList(); }
  } catch (err) { alert("AI Error"); }
}

async function addWordToCurrentList() {
  const word = document.getElementById("newWord").value;
  const meaning = document.getElementById("newMeaning").value;

  if (!word) return alert("กรุณาใส่คำศัพท์");

  try {
    const res = await fetch(`/api/lists/${listId}/add-word`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, meaning })
    });

    if (res.ok) {
      document.getElementById("newWord").value = "";
      document.getElementById("newMeaning").value = "";
      loadList();
    }
  } catch (err) { alert("Failed to add word"); }
}

async function deleteSelected() {
  const checkboxes = document.querySelectorAll(".word-checkbox:checked");
  const itemIds = Array.from(checkboxes).map(cb => cb.value);
  if (itemIds.length === 0) return alert("กรุณาเลือกคำที่จะลบ");
  if (!confirm("ลบคำศัพท์ที่เลือก?")) return;
  const res = await fetch(`/api/lists/${listId}/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds })
  });
  if (res.ok) { loadList(); }
}

function toggleAllCheckboxes(source) {
  document.querySelectorAll(".word-checkbox").forEach(cb => cb.checked = source.checked);
}

document.addEventListener("DOMContentLoaded", loadList);