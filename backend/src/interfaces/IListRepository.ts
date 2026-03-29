// 🚩 IListRepository.ts
export interface IListRepository {
  // เพิ่ม vocab_count เพื่อให้หน้า Collections แสดงตัวเลขได้
  getLists(userId: string): Promise<{ list_id: string; name: string; vocab_count: number }[]>;
}

// 🚩 SqlListRepository.ts
// ใน Query ของโบรถูกต้องแล้วครับ แค่ตรวจสอบว่า return ค่าให้ตรงกับ Interface