const BASE_URL = "http://localhost:5000/api/vocab";
const USER_ID = "888f10a9-6345-4a8a-99a1-79984863acf1";

// Fetch all vocabulary lists for the current user
export const getLists = async () => {
  const res = await fetch(`${BASE_URL}/lists?userId=${USER_ID}`);
  if (!res.ok) throw new Error("Failed to fetch vocabulary lists.");
  return res.json();
};

// Fetch vocabulary items, optionally filtered by list ID
export const getVocabs = async (listId?: string) => {
  const url = listId 
    ? `${BASE_URL}/items?userId=${USER_ID}&listId=${listId}`
    : `${BASE_URL}/items?userId=${USER_ID}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vocabulary items.");
  return res.json();
};

// Save a new vocabulary item to a specific list
export const saveNewVocab = async (data: { 
  word: string, 
  definition: string, 
  listId: string, 
  userId: string,
  skipAI: boolean 
}) => {
  const res = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to save vocabulary item.");
  }

  return res.json();
};

// Update an existing vocabulary item's details
export const updateVocab = async (id: string, data: { word: string, definition: string }) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update vocabulary item.");
  return res.json();
};

// Remove a vocabulary item by ID
export const deleteVocab = async (id: string) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Failed to delete vocabulary item.");
  return res.json();
};

// Generate a definition for a word using AI
export const generateAIDefinition = async (word: string) => {
  const res = await fetch(`${BASE_URL}/generate-definition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
  if (!res.ok) throw new Error("AI service is currently unavailable.");
  const data = await res.json();
  return data.definition;
};

// Fetch general dashboard statistics
export const getDashboardStats = async () => {
  const response = await fetch(`${BASE_URL}/dashboard?userId=${USER_ID}`);
  if (!response.ok) throw new Error("Failed to fetch dashboard statistics.");
  return response.json();
};

// Fetch summary metrics including learning progress and history
export const getSummary = async () => {
  const response = await fetch(`${BASE_URL}/summary?userId=${USER_ID}`);
  if (!response.ok) throw new Error("Failed to fetch summary data.");
  return response.json();
};

// Fetch vocabulary items that are due for review today
export const getDueVocabs = async () => {
  const response = await fetch(`${BASE_URL}/due?userId=${USER_ID}`);
  if (!response.ok) throw new Error("Failed to fetch pending reviews.");
  return response.json();
};

// Submit a review result for an item
export const submitReview = async (data: { 
  learningItemId: string, 
  userId: string, 
  rating: number,
  responseTimeMs: number 
}) => {
  const res = await fetch(`${BASE_URL}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit review record.");
  return res.json();
};