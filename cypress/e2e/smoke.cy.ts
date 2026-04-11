describe('smarTODO smoke test', () => {
  it('visits the app root and loads', () => {
    cy.visit('/');
    cy.get('body').should('exist');
    cy.get('[data-testid="home-page"]').should('exist');
  });

  it('displays the smarTODO heading', () => {
    cy.visit('/');
    cy.get('[data-testid="hero-heading"]').should('contain.text', 'smarTODO');
  });

  it('displays the features grid', () => {
    cy.visit('/');
    cy.get('[data-testid="features-grid"]').should('exist');
  });
});
