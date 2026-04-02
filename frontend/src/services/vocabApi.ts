const API_ROOT = process.env.REACT_APP_API_URL || "";
const BASE_URL = `${API_ROOT}/api/vocab`;
// const USER_ID = "888f10a9-6345-4a8a-99a1-79984863acf1";

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}` // ✅ ต้องมีเพื่อให้ Backend รู้ว่าเป็นใคร
});

export const getDashboardStats = async () => {
  const response = await fetch(`${BASE_URL}/dashboard`, { headers: getHeaders() });
  if (!response.ok) {
     const errorBody = await response.text();
     console.error("Backend Error Body:", errorBody); // ✅ ช่วยดูว่าหลังบ้านบ่นว่าอะไร
     throw new Error("Failed to fetch dashboard statistics.");
  }
  return response.json();
};

// Fetch all vocabulary lists for the current user
export const getLists = async () => {
  const res = await fetch(`${BASE_URL}/lists`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch vocabulary lists.");
  return res.json();
};

export const getDueVocabs = async () => {
  const response = await fetch(`${BASE_URL}/today`, { headers: getHeaders() }); // ✅ เปลี่ยนจาก /due เป็น /today ให้ตรงหลังบ้าน
  if (!response.ok) throw new Error("Failed to fetch pending reviews.");
  return response.json();
};




// Fetch vocabulary items, optionally filtered by list ID
export const getVocabs = async (listId?: string) => {
  const cleanListId = listId?.trim();
  const url = cleanListId
    ? `${BASE_URL}/items?listId=${listId}`
    : `${BASE_URL}/items`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders()
  });
  
  if (!res.ok) {
    const errorMsg = await res.text();
     console.error("Backend Error Detail:", errorMsg);
     throw new Error("Failed to fetch vocabulary items.");
  }
  return res.json();
};

// Save a new vocabulary item to a specific list
export const saveNewVocab = async (data: { 
  word: string, 
  definition: string, 
  listId: string, 
  userId?: string,
  skipAI: boolean 
}) => {
  const res = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to save vocabulary item.");
  }

  return res.json();
};

// Update an existing vocabulary item's details
export const updateVocab = async (itemId: string, data: { word: string, definition: string, listId?: string }) => {
    const res = await fetch(`${BASE_URL}/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update vocabulary item.");
    return res.json();
};

// Remove a vocabulary item by ID
export const deleteVocab = async (id: string) => {
  const res = await fetch(`${BASE_URL}/items/${id}`, { 
    method: 'DELETE',
    headers: getHeaders()
  });
  
  if (!res.ok) {
    const errorMsg = await res.text();
    console.error("Delete Error:", errorMsg);
    throw new Error("Failed to delete vocabulary item.");
  }
  return res.json();
};

// Generate a definition for a word using AI
export const generateAIDefinition = async (word: string) => {
  const res = await fetch(`${BASE_URL}/generate-definition`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ word }),
  });
  if (!res.ok) throw new Error("AI service is currently unavailable.");
  const data = await res.json();
  return data.definition;
};

// Fetch summary metrics including learning progress and history
export const getSummary = async () => {
  const response = await fetch(`${BASE_URL}/summary`, { headers: getHeaders() });
  if (!response.ok) throw new Error("Failed to fetch summary data.");
  return response.json();
};

// Submit a review result for an item
export const submitReview = async (data: { 
  learningItemId: string, 
  rating: number,
  responseTimeMs: number 
}) => {
  const res = await fetch(`${BASE_URL}/review`, {
    method: 'POST',
  headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit review record.");
  return res.json();
};

export const subscribePush = async (subscription: any) => {
  const res = await fetch(`${BASE_URL}/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ subscription }),
  });
  return res.json();
};

export const getListPractice = async (listId: string) => {
  const res = await fetch(`${BASE_URL}/practice/list/${listId}`, { 
    headers: getHeaders() 
  });
  if (!res.ok) throw new Error("ไม่สามารถโหลดบทเรียนจากลิสต์นี้ได้");
  return res.json();
};