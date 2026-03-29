const params = new URLSearchParams(window.location.search);
const listId = params.get("id");

async function loadListDetail() {
    const res = await fetch(`/api/lists/${listId}`);
    const words = await res.json();
    const tbody = document.getElementById("wordTableBody");
    
    if (!Array.isArray(words)) return;
    
    tbody.innerHTML = words.map(w => `
        <tr id="row-${w.learning_item_id}">
            <td class="col-chk">
                <input type="checkbox" class="word-chk" value="${w.learning_item_id}">
            </td>
            
            <td class="title-cell">
                <span class="display-text"><strong>${w.title}</strong></span>
                <input type="text" class="edit-input-field" value="${w.title}" style="display:none; width:100%;">
            </td>
            
            <td class="content-cell">
                <span class="display-text">${w.content || 'ยังไม่มีความหมาย...'}</span>
                <textarea class="edit-input-field" style="display:none; width:100%; height:60px;">${w.content || ''}</textarea>
            </td>
            
            <td class="col-action">
                <div class="action-wrapper">
                    <button class="action-btn" onclick="toggleEdit('${w.learning_item_id}', this)">✎</button>
                    <button class="action-btn" onclick="generateSingleAI('${w.learning_item_id}', this)">🪄</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function runAIBatch() {
    const btn = document.getElementById("aiBtn");
    const originalText = btn.innerText;
    btn.innerText = "⏳ AI กำลังทำงาน...";
    btn.disabled = true;

    try {
        // ต้องส่ง listId ไปด้วยเพื่อให้ Backend รู้ขอบเขตการทำงาน
        const res = await fetch('/api/vocabs/generate-batch', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listId: listId }) // ส่ง listId ไปใน body
        });

        if (res.ok) {
            await loadListDetail();
            alert("เจนความหมายครบทุกคำแล้วค่ะ!");
        }
    } catch (err) {
        console.error("Batch AI Error:", err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ฟังก์ชันเจน AI ทีละคำ
async function generateSingleAI(itemId, btn) {
    const startTime = Date.now();
    const originalText = btn.innerText;
    btn.disabled = true;

    try {
        const res = await fetch(`/api/vocabs/${itemId}/generate`, { method: 'POST' });
        const data = await res.json();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (res.status === 429) {
            console.error(`❌ Quota Exhausted (429):`, data.details);
            alert(`โควตา Gemini เต็มแล้วค่ะ! ระบบจะล็อคปุ่ม 60 วินาทีเพื่อให้ API รีเซ็ตนะคะ`);
            startCooldown(btn, 60); // ล็อคปุ่มยาว 1 นาทีตาม Error Log
            return;
        }

        if (res.ok) {
            console.log(`✅ AI Generated in ${duration}s`);
            loadListDetail();
            startCooldown(btn, 3); // ล็อคสั้นๆ 3 วิหลังสำเร็จเพื่อป้องกันการกดรัว
        } else {
            console.error(`❌ Server Error (${res.status}):`, data.details || data.error);
            alert(`เกิดข้อผิดพลาด: ${data.error || 'AI ไม่ตอบสนอง'}`);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error("Single AI Fetch Error:", err);
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// เพิ่มฟังก์ชันนี้ไว้ใต้ generateSingleAI เพื่อให้นับถอยหลังที่ปุ่มได้
function startCooldown(btn, seconds) {
    let timeLeft = seconds;
    const originalText = "🪄 Gen";
    
    const timer = setInterval(() => {
        if (timeLeft > 0) {
            btn.innerText = `⏳ ${timeLeft}s`;
            btn.disabled = true;
            timeLeft--;
        } else {
            clearInterval(timer);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }, 1000);
}

// ฟังก์ชันเพิ่มคำศัพท์ใหม่ลงใน List นี้โดยตรง
async function addNewWordToList() {
    const title = document.getElementById("newWordTitle").value;
    const content = document.getElementById("newWordContent").value;

    if (!title) return alert("กรุณาใส่คำศัพท์");

    try {
        if (!listId) throw new Error("ไม่พบ List ID ใน URL");

        const res = await fetch(`/api/lists/${listId}/add-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: title, meaning: content })
        });

        if (res.ok) {
            console.log("เพิ่มคำศัพท์สำเร็จ!");
            document.getElementById("newWordTitle").value = "";
            document.getElementById("newWordContent").value = "";
            loadListDetail(); // รีโหลดตาราง
        } else {
            const errorData = await res.json();
            alert("เพิ่มไม่สำเร็จ: " + (errorData.error || "Unknown Error"));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Add word failed");
    }
}

async function deleteSelected() {
    const checked = document.querySelectorAll('.word-chk:checked');
    const ids = Array.from(checked).map(c => c.value);

    if (ids.length === 0) return alert("กรุณาเลือกคำศัพท์ที่ต้องการลบ");
    if (!confirm(`ยืนยันการลบ ${ids.length} รายการ?`)) return;

    try {
        const res = await fetch(`/api/lists/${listId}/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemIds: ids })
        });

        if (res.ok) {
            loadListDetail(); // รีโหลดตาราง
        } else {
            alert("ลบไม่สำเร็จ");
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
}

async function toggleEdit(id, btn) {
    const row = document.getElementById(`row-${id}`);
    const displayTexts = row.querySelectorAll(".display-text");
    const inputFields = row.querySelectorAll(".edit-input-field");
    const isEditing = btn.innerText === "💾";

    if (!isEditing) {
        // --- สลับโหมด: ซ่อนตัวหนังสือ โชว์ Input ---
        displayTexts.forEach(el => el.style.display = "none");
        inputFields.forEach(el => el.style.display = "block");
        btn.innerText = "💾";
    } else {
        // --- กดบันทึก ---
        const newTitle = inputFields[0].value;
        const newContent = inputFields[1].value;

        // เช็คข้อมูลเดิม (ถ้าไม่เปลี่ยนเลย ก็แค่สลับกลับ)
        if (newTitle === displayTexts[0].innerText && newContent === (displayTexts[1].innerText === "ยังไม่มีความหมาย..." ? "" : displayTexts[1].innerText)) {
            displayTexts.forEach(el => el.style.display = "block");
            inputFields.forEach(el => el.style.display = "none");
            btn.innerText = "✎";
            return;
        }

        const res = await fetch(`/api/vocabs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, content: newContent })
        });

        if (res.ok) {
            await loadListDetail(); // รีโหลดเพื่ออัปเดตข้อมูลจริง
        } else {
            alert("บันทึกไม่สำเร็จ");
        }
    }
}

function toggleAll(source) {
    document.querySelectorAll('.word-chk').forEach(c => c.checked = source.checked);
}

loadListDetail();