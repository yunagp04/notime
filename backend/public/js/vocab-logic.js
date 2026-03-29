async function loadAllVocabs() {
    const res = await fetch('/api/vocabs');
    const data = await res.json();
    const tbody = document.getElementById("vocabTableBody");
    tbody.innerHTML = data.map(v => `
        <tr>
            <td><strong>${v.title}</strong></td>
            <td>${v.content || ''}</td>
            <td><button onclick="deleteVocab('${v.learning_item_id}')">ลบ</button></td>
        </tr>
    `).join('');
}

async function saveVocab() {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const res = await fetch('/api/vocabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    if (res.ok) {
        location.reload();
    } else {
        alert("Failed to save vocab");
    }
}

async function deleteVocab(id) {
    if (!confirm("ยืนยันการลบคำศัพท์นี้ออกจากคลัง?")) return;

    try {
        const res = await fetch(`/api/vocabs/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadAllVocabs(); // รีโหลดตารางเมื่อลบสำเร็จ
        } else {
            const err = await res.json();
            alert("ลบไม่สำเร็จ: " + (err.error || "Unknown Error"));
        }
    } catch (err) {
        console.error("Delete Error:", err);
        alert("เกิดข้อผิดพลาดในการลบ");
    }
}

loadAllVocabs();