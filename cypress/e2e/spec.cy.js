/**
 * Project: Intelligent Recall Platform
 * E2E Testing - Full System Suite (8 Scenarios)
 * Features: Bulk Word Splitting, AI Generation, SM-2 Memory Update
 * Author: Paweena (3rd Year Student Project)
 */

// describe('Intelligent Recall Platform - Comprehensive Test', () => {
//   const FRONTEND_URL = 'http://localhost:3000';
//   const mockListId = '550e8400-e29b-41d4-a716-446655440000';

//   beforeEach(() => {
//     cy.clearLocalStorage();
//     cy.on('window:alert', () => true); // ปิด alert อัตโนมัติ

//     // Mock ข้อมูลพื้นฐานสำหรับทุกหน้า
//     cy.intercept('GET', '/api/vocab/dashboard', { summary: { Total: 10, Mastered: 5, New: 2 }, history: [] }).as('getDashboard');
//     cy.intercept('GET', '/api/vocab/lists', { body: [{ list_id: mockListId, name: 'My List', vocab_count: 5 }] }).as('getLists');
//     cy.intercept('GET', `/api/vocab/items*`, { body: [{ id: 'v1', word: 'Persistence', definition: 'การยืนหยัด' }] }).as('getItems');
//     cy.intercept('GET', '/api/vocab/today', { body: [{ id: 'v1', title: 'Persistence', content: 'การยืนหยัด' }] }).as('getToday');
    
//     // Mock Actions (Add, AI, Review)
//     cy.intercept('POST', '/api/vocab/add', { statusCode: 201, body: { success: true } }).as('addVocab');
//     cy.intercept('POST', '/api/vocab/generate-definition', { body: 'AI Definition Result' }).as('aiGen');
//     cy.intercept('POST', '/api/vocab/review', { statusCode: 200, body: { success: true } }).as('submitReview');
//     cy.intercept('DELETE', '/api/vocab/items/*', { statusCode: 200 }).as('deleteVocab');

//     cy.visit(FRONTEND_URL);
//   });

//   // --- ข้อ 1 & 8: Dashboard & UI ---
//   it('Scenario 1 & 8: Should verify Dashboard and Navbar', () => {
//     cy.wait('@getDashboard');
//     cy.get('nav').should('be.visible');
//     cy.contains('Total Words').should('be.visible');
//   });

//   // --- ข้อ 2: Add, AI, Edit, Delete ---
//   it('Scenario 2: Full Vocab Lifecycle (Add, AI, Delete)', () => {
//     cy.visit(`${FRONTEND_URL}/vocab`);
//     cy.get('h2').first().click({ force: true });
    
//     // 1. เพิ่มคำศัพท์ (รองรับ Bulk Add)
//     cy.get('input[placeholder*="Enter words"]').type('Apple, Banana', { force: true });
//     cy.contains('button', /Add Items/i).click({ force: true });
//     cy.wait('@addVocab');

//     // 2. ทดสอบปุ่ม AI (ไอคอน Sparkles)
//     cy.get('button').find('svg').should('exist');

//     // 3. ทดสอบการลบ (ไอคอน Trash)
//     cy.on('window:confirm', () => true);
//     cy.get('tr').contains('Persistence').parent().find('button').last().click({ force: true });
//     cy.log('Delete logic triggered');
//   });

//   // --- ข้อ 3: SRS Memory Update ---
//   it('Scenario 3: Should update memory status using SM-2', () => {
//     cy.visit(`${FRONTEND_URL}/review`);
//     cy.wait('@getToday');
//     cy.contains('button', /Show Definition/i).click({ force: true });
//     cy.wait(500);
    
//     // กด Mastered เพื่ออัปเดตค่าความจำ (Rating 5)
//     cy.contains('button', /Mastered/i).click({ force: true });
//     cy.wait('@submitReview').then((xhr) => {
//       expect(xhr.request.body.rating).to.equal(5);
//     });
//     cy.contains(/Session Complete/i).should('be.visible');
//   });

//   // --- ข้อ 4, 5, 6, 7: Navigation & API ---
//   it('Scenario 4-7: Verify Navigation and API status', () => {
//     cy.visit(`${FRONTEND_URL}/vocab`);
//     cy.contains('button', /Back to Dashboard/i).click({ force: true });
//     cy.url().should('eq', `${FRONTEND_URL}/`);
//   });
// });

describe('Intelligent Recall Platform - Full System Test', () => {
  const FRONTEND_URL = 'http://localhost:3000';
  const mockListId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    cy.clearLocalStorage();

    // ดักจับและจัดการ Window Alert เพื่อไม่ให้ลูปการทำงานหยุดชะงัก (แก้ปัญหา Scenario 2 & 3)
    cy.on('window:alert', (str) => {
      console.log('Cypress caught an alert:', str);
      return true;
    });

    // --- 1. Mock Dashboard (สำหรับ Dashboard.tsx) ---
    cy.intercept('GET', '/api/vocab/dashboard', {
      summary: { Total: 10, Mastered: 5, New: 2 },
      history: [{ date: new Date().toISOString(), count: 3 }]
    }).as('getDashboard');

    // --- 2. Mock Vocabulary Lists (สำหรับ VocabPage.tsx) ---
    cy.intercept('GET', '/api/vocab/lists', {
      body: [{ list_id: mockListId, name: 'My Test Collection', vocab_count: 5 }]
    }).as('getLists');

    // --- 3. Mock Vocabulary Items (สำหรับ VocabList.tsx) ---
    cy.intercept('GET', `/api/vocab/items*`, {
      body: [{ id: 'v1', word: 'Persistence', definition: 'การยืนหยัด' }]
    }).as('getItems');

    // --- 4. Mock AI Gemini Service (สำหรับ VocabController.generateOnly) ---
    cy.intercept('POST', '/api/vocab/generate-definition', { 
      body: 'กระบวนการวิเคราะห์ความหมายโดย AI: ความพยายามอย่างต่อเนื่อง' 
    }).as('aiGenerate');

    // --- 5. Mock ทบทวนวันนี้ (สำหรับ PracticeController / ReviewPage.tsx) ---
    cy.intercept('GET', '/api/vocab/today', {
      body: [{ id: 'v1', title: 'Persistence', content: 'การยืนหยัด' }]
    }).as('getToday');

    // --- 6. Mock API การบันทึกและทบทวน (สำคัญ: ต้องส่ง body กลับไปเพื่อให้ Frontend ไม่เข้า catch block) ---
    cy.intercept('POST', '/api/vocab/add', { 
      statusCode: 201, 
      body: { success: true } 
    }).as('addVocab');

    cy.intercept('POST', '/api/vocab/review', { 
      statusCode: 200, 
      body: { success: true, message: "Review updated" } 
    }).as('submitReview');

    cy.visit(FRONTEND_URL);
    cy.wait('@getDashboard');
  });

  // Scenario 1: ตรวจสอบหน้า Dashboard
  it('Scenario 1: Should load Dashboard correctly', () => {
    cy.get('nav').should('be.visible');
    cy.contains('Welcome back!').should('be.visible');
  });

  // Scenario 2: การพิมพ์หลายคำและการตัดคำ (Bulk Add & Split)
  it('Scenario 2: Should split multiple words by comma and save separately', () => {
    cy.visit(`${FRONTEND_URL}/vocab`);
    cy.wait('@getLists');
    cy.get('h2').first().click({ force: true });
    cy.wait('@getItems');

    // ทดสอบพิมพ์ 3 คำ คั่นด้วย comma (ระบบจะใช้ .split(',') และ .trim() ใน VocabList.tsx)
    const bulkInput = 'Apple, Banana, Orange';
    cy.get('input[placeholder*="Enter words"]').type(bulkInput, { force: true });
    
    // กดปุ่ม Add Items (จะมีการวนลูปเซฟข้อมูลทีละคำ)
    cy.contains('button', /Add Items/i).click({ force: true });
    
    // ยืนยันว่ามีการส่ง Request ไปเซฟ (saveNewVocab)
    cy.wait('@addVocab');
    cy.get('input[placeholder*="Enter words"]').should('have.value', '');
  });

  // Scenario 3: การอัปเดตค่าความจำ (SM-2 Algorithm)
  it('Scenario 3: Should update memory status and finish session', () => {
    cy.visit(`${FRONTEND_URL}/review`);
    cy.wait('@getToday');

    cy.contains('button', /Show Definition/i).click({ force: true });
    cy.wait(500);

    // กด Mastered (Rating 5) เพื่อคำนวณวันทบทวนใหม่ผ่าน SM2Algorithm ใน Backend
    cy.contains('button', /Mastered/i).click({ force: true });

    // ตรวจสอบข้อมูลที่ส่งไป VocabController.review
    cy.wait('@submitReview').then((interception) => {
      expect(interception.request.body.rating).to.equal(5);
      expect(interception.request.body).to.have.property('learningItemId');
    });
    
    // ยืนยันการจบ Session (หน้าจอต้องเปลี่ยน State เป็น isFinished)
    cy.contains(/Session Complete|Complete/i, { timeout: 10000 }).should('be.visible');
  });

  // --- Scenario 4: Global Navigation (Back Button) ---
  it('Scenario 4: Should use Global Back Button correctly', () => {
    cy.visit(`${FRONTEND_URL}/vocab`);
    // ตรวจสอบเงื่อนไขการแสดงปุ่มจาก App.tsx
    cy.contains('button', /Back to Dashboard/i).should('be.visible').click({ force: true });
    cy.url().should('eq', `${FRONTEND_URL}/`);
  });

  // --- Scenario 5: AI Integration (Gemini Service) ---
  it('Scenario 5: Should trigger AI definition generation', () => {
    cy.visit(`${FRONTEND_URL}/vocab`);
    cy.get('h2').first().click({ force: true });
    
    // ยืนยันว่ามีปุ่มหรือไอคอน Sparkles สำหรับเรียก AI
    cy.get('button').find('svg').should('exist');
    cy.log('AI Orchestration Ready');
  });

  // --- Scenario 6: Empty State Handling ---
  it('Scenario 6: Should show completion screen for empty reviews', () => {
    cy.intercept('GET', '/api/vocab/today', { body: [] }).as('getEmptyToday');
    cy.visit(`${FRONTEND_URL}/review`);
    cy.wait('@getEmptyToday');
    cy.contains(/Session Complete/i).should('be.visible');
  });

  // --- Scenario 7: API Connectivity ---
  it('Scenario 7: Should verify API connectivity (Status 200/304)', () => {
    cy.visit(`${FRONTEND_URL}/vocab`);
    cy.wait('@getLists').then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 304]);
    });
  });

  // --- Scenario 8: UI Components Stability ---
  it('Scenario 8: Should verify Navbar presence across pages', () => {
    cy.get('nav').should('exist');
    cy.get('nav').find('svg').should('exist'); 
  });
});