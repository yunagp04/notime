describe('🛠️ Deep Debug: หาจุดตายของ Error 500', () => {
    // ใส่ ID ของ List ที่คุณเปิดอยู่ในหน้าจอ (จากรูปคือ BBD48E02...)
    const listId = 'BBD48E02-3713-4E5E-AF1E-81B255A732F2'; 

    beforeEach(() => {
        cy.visit(`http://localhost:8080/list-detail.html?id=${listId}`);
    });

    it('1. ทดสอบเพิ่มคำศัพท์และดู Error Message จาก Server', () => {
        // ดักจับ Request และดู Response Body
        cy.intercept('POST', '**/add-word').as('addWordReq');

        cy.get('#newWordTitle').type('DebugWord');
        cy.get('#newWordContent').type('Testing context');
        
        // ใช้คำสั่ง click แบบบังคับ เผื่อปุ่มโดนอะไรทับ
        cy.contains('ADD WORD').click({ force: true });

        cy.wait('@addWordReq').then((interception) => {
            const response = interception.response;
            cy.log('HTTP Status:', response.statusCode);
            
            // พิมพ์ Error ที่แท้จริงออกมาในหน้าจอ Cypress
            if (response.statusCode === 500) {
                const errorDetail = JSON.stringify(response.body);
                cy.log('❌ Server Error Detail:', errorDetail);
                console.log('Server Error:', response.body);
                
                // ถ้าใน body มีคำว่า "sql is not defined" หรือ "ReferenceError" 
                // แสดงว่าเราลืม Import ของบางอย่างใน Controller ครับ
            }
        });
    });

    it('2. ทดสอบปุ่ม AI Gen ทีละคำ และดู Log', () => {
        cy.intercept('POST', '**/generate').as('aiGenReq');

        // หาปุ่ม Gen ปุ่มแรกในตาราง
        cy.get('button').contains('Gen').first().click();

        cy.wait('@aiGenReq', { timeout: 15000 }).then((interception) => {
            cy.log('AI Response Status:', interception.response.statusCode);
            if (interception.response.statusCode === 500) {
                cy.log('❌ AI Error Detail:', JSON.stringify(interception.response.body));
            }
        });
    });
});