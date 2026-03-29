describe('Debug: ระบบเพิ่มคำศัพท์ และ AI Single Gen', () => {
  const testListId = 'BBD48E02-3713-4E5E-AF1E-81B255A732F2'; // ID จากภาพที่คุณส่งมา

  beforeEach(() => {
    // ไปที่หน้า Detail ของ List นั้นโดยตรง
    cy.visit(`http://localhost:8080/list-detail.html?id=${testListId}`);
  });

  it('1. ตรวจสอบการเพิ่มคำศัพท์ใหม่ (Add Word)', () => {
    const randomWord = 'TestWord_' + Math.floor(Math.random() * 1000);
    
    // ดักจับ Request เพื่อดูว่า Server ตอบอะไรกลับมา
    cy.intercept('POST', '**/add-word').as('postWord');

    cy.get('#newWordTitle').type(randomWord);
    cy.get('#newWordContent').type('ทดสอบเพิ่มคำ');
    cy.get('button').contains('ADD WORD').click();

    // รอผลจาก Server
    cy.wait('@postWord').then((interception) => {
      const status = interception.response.statusCode;
      const body = interception.response.body;
      
      console.log('--- Debug Add Word ---');
      console.log('Status:', status);
      console.log('Response Body:', body);

      if (status === 500) {
        throw new Error(`Server พังด้วย Error: ${JSON.stringify(body)} \nเช็คที่ Terminal ของ Backend ด่วนค่ะ!`);
      }
    });

    cy.contains(randomWord).should('be.visible');
  });

  it('2. ตรวจสอบการเจน AI ทีละคำ (Single Gen)', () => {
    cy.intercept('POST', '**/generate').as('aiGen');

    // กดปุ่ม Gen ปุ่มแรกที่เจอในตาราง
    cy.get('button').contains('Gen').first().click();

    cy.wait('@aiGen', { timeout: 15000 }).then((interception) => {
      const status = interception.response.statusCode;
      console.log('--- Debug AI Gen ---');
      console.log('Status:', status);
      console.log('Response:', interception.response.body);

      if (status === 500) {
        throw new Error('AI Gen พัง! อาจเพราะหาไฟล์ ai.factory.js ไม่เจอ หรือ API Key มีปัญหา');
      }
    });
  });
});