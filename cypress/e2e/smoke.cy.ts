// Smoke test — updated in Step 0.6 once the Next.js app is running
describe('smarTODO smoke test', () => {
  it('visits the app root and loads', () => {
    cy.visit('/');
    cy.get('body').should('exist');
  });
});
