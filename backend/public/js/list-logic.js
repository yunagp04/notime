async function loadLists() {
    try {
        const res = await fetch('/api/lists', {
            headers: { 'x-ms-client-principal-id' : '112447486850399769662' }
        });
        
        // เช็คว่ายิง API สำเร็จไหม
        if (!res.ok) throw new Error("เรียกข้อมูลไม่สำเร็จ");

        const lists = await res.json();
        const container = document.getElementById("listContainer");

        // ตรวจสอบว่าเป็น Array จริงไหม
        if (!Array.isArray(lists)) {
            console.error("Data is not an array:", lists);
            container.innerHTML = "<p>ไม่พบข้อมูลกลุ่มคำศัพท์</p>";
            return;
        }

        container.innerHTML = lists.map(list => `
            <div class="list-card" id="list-${list.list_id}" style="border:2px solid #000; padding:15px; margin:10px; position:relative;">
                <div onclick="location.href='/list-detail.html?id=${list.list_id}'" style="cursor:pointer;">
                    <h3 style="margin-top:0;">${list.list_name}</h3>
                    <p>${list.total_words || 0} คำ</p>
                </div>
                <div style="margin-top:15px; display:flex; gap:8px;">
                    <button onclick="renameList('${list.list_id}', '${list.list_name}')" style="cursor:pointer; padding:5px 10px;">✎ แก้ชื่อ</button>
                    <button onclick="deleteList('${list.list_id}')" style="cursor:pointer; padding:5px 10px; background:#ff4444; color:white; border:none;">🗑️ ลบกลุ่ม</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Load lists error:", err);
        document.getElementById("listContainer").innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>";
    }
}

// ฟังก์ชันแก้ชื่อกลุ่ม
async function renameList(id, oldName) {
    const newName = prompt("ระบุชื่อกลุ่มใหม่:", oldName);
    if (!newName || newName === oldName) return;

    const res = await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'x-ms-client-principal-id': 'dev-user-id'
        },
        body: JSON.stringify({ list_name: newName })
    });

    if (res.ok) loadLists();
}

// ฟังก์ชันลบกลุ่ม (คำยังอยู่ในคลังหลัก)
async function deleteList(id) {
    if (!confirm("ลบกลุ่มนี้ใช่หรือไม่? (คำศัพท์จะยังอยู่ในคลังกลาง แต่หายจากกลุ่มนี้)")) return;

    const res = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
        headers: { 'x-ms-client-principal-id': 'dev-user-id' }
    });

    if (res.ok) loadLists();
}

async function createNewList() {
    const name = prompt("ระบุชื่อกลุ่มคำศัพท์:");
    if (!name) return;
    await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_name: name, description: "สร้างจากหน้าเว็บ" })
    });
    loadLists();
}
loadLists();