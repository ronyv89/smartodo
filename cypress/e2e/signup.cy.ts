/**
 * E2E tests for the /auth/signup page.
 *
 * These tests cover:
 * - Page rendering
 * - Password requirements panel (live feedback)
 * - Password strength indicator
 * - Client-side validation preventing submission with a weak password
 * - Each individual requirement gate
 * - Navigation links
 *
 * Note: Tests that would complete a real signup (network call to Supabase) are
 * intentionally skipped here to keep E2E tests self-contained and reliable.
 * The actual signUp network path is covered by the integration tests.
 */

describe('Signup page — rendering', () => {
  beforeEach(() => {
    cy.visit('/auth/signup');
  });

  it('renders the signup form with all fields', () => {
    cy.get('[data-testid="signup-form"]').should('exist');
    cy.get('[data-testid="signup-full-name"]').should('exist');
    cy.get('[data-testid="signup-email"]').should('exist');
    cy.get('[data-testid="signup-password"]').should('exist');
    cy.get('[data-testid="signup-submit"]').should('exist');
  });

  it('does not show the password requirements panel before typing', () => {
    cy.get('[data-testid="password-requirements"]').should('not.exist');
  });

  it('does not show an error banner on initial load', () => {
    cy.get('[data-testid="signup-error"]').should('not.exist');
  });
});

describe('Signup page — password requirements panel', () => {
  beforeEach(() => {
    cy.visit('/auth/signup');
  });

  it('shows the requirements panel once the user starts typing a password', () => {
    cy.get('[data-testid="signup-password"]').type('a');
    cy.get('[data-testid="password-requirements"]').should('be.visible');
  });

  it('marks the length requirement as unmet for a short password', () => {
    cy.get('[data-testid="signup-password"]').type('Ab1!');
    cy.get('[data-testid="req-length"]').should('have.attr', 'data-met', 'false');
  });

  it('marks the length requirement as met at 8 characters', () => {
    cy.get('[data-testid="signup-password"]').type('abcdefgh');
    cy.get('[data-testid="req-length"]').should('have.attr', 'data-met', 'true');
  });

  it('marks the uppercase requirement as unmet when no uppercase letter present', () => {
    cy.get('[data-testid="signup-password"]').type('nouppercase1!');
    cy.get('[data-testid="req-uppercase"]').should('have.attr', 'data-met', 'false');
  });

  it('marks the uppercase requirement as met when an uppercase letter is added', () => {
    cy.get('[data-testid="signup-password"]').type('HasUppercase1!');
    cy.get('[data-testid="req-uppercase"]').should('have.attr', 'data-met', 'true');
  });

  it('marks the lowercase requirement as unmet when all letters are uppercase', () => {
    cy.get('[data-testid="signup-password"]').type('NOLOWER1!');
    cy.get('[data-testid="req-lowercase"]').should('have.attr', 'data-met', 'false');
  });

  it('marks the number requirement as unmet when no digit is present', () => {
    cy.get('[data-testid="signup-password"]').type('NoNumber!abc');
    cy.get('[data-testid="req-number"]').should('have.attr', 'data-met', 'false');
  });

  it('marks the number requirement as met when a digit is added', () => {
    cy.get('[data-testid="signup-password"]').type('HasNumber1!abc');
    cy.get('[data-testid="req-number"]').should('have.attr', 'data-met', 'true');
  });

  it('marks the special character requirement as unmet when none present', () => {
    cy.get('[data-testid="signup-password"]').type('NoSpecial123');
    cy.get('[data-testid="req-special"]').should('have.attr', 'data-met', 'false');
  });

  it('marks the special character requirement as met when one is added', () => {
    cy.get('[data-testid="signup-password"]').type('HasSpecial1!');
    cy.get('[data-testid="req-special"]').should('have.attr', 'data-met', 'true');
  });

  it('marks all requirements as met for a fully valid password', () => {
    cy.get('[data-testid="signup-password"]').type('Secure@Pass1');
    for (const id of ['length', 'uppercase', 'lowercase', 'number', 'special']) {
      cy.get(`[data-testid="req-${id}"]`).should('have.attr', 'data-met', 'true');
    }
  });
});

describe('Signup page — password strength indicator', () => {
  beforeEach(() => {
    cy.visit('/auth/signup');
  });

  it('shows "weak" for a password meeting only one requirement', () => {
    cy.get('[data-testid="signup-password"]').type('a');
    cy.get('[data-testid="password-strength"]').should('have.attr', 'data-strength', 'weak');
  });

  it('shows "fair" for a password meeting two requirements (length + lowercase)', () => {
    cy.get('[data-testid="signup-password"]').type('abcdefgh');
    cy.get('[data-testid="password-strength"]').should('have.attr', 'data-strength', 'fair');
  });

  it('shows "strong" when three or four requirements are met', () => {
    // length + lowercase + uppercase = 3 requirements
    cy.get('[data-testid="signup-password"]').type('abcdefgH');
    cy.get('[data-testid="password-strength"]').should('have.attr', 'data-strength', 'strong');
  });

  it('shows "very-strong" when all five requirements are met', () => {
    cy.get('[data-testid="signup-password"]').type('Secure@Pass1');
    cy.get('[data-testid="password-strength"]').should('have.attr', 'data-strength', 'very-strong');
  });
});

describe('Signup page — client-side validation on submit', () => {
  beforeEach(() => {
    cy.visit('/auth/signup');
  });

  function fillAndSubmit(password: string) {
    cy.get('[data-testid="signup-full-name"]').type('Jane Smith');
    cy.get('[data-testid="signup-email"]').type('jane@example.com');
    cy.get('[data-testid="signup-password"]').type(password);
    cy.get('[data-testid="signup-submit"]').click();
  }

  it('shows a validation error when the password is too short', () => {
    fillAndSubmit('Weak1!');
    cy.get('[data-testid="signup-error"]').should('be.visible');
  });

  it('shows a validation error when the password has no uppercase letter', () => {
    fillAndSubmit('nouppercase1!');
    cy.get('[data-testid="signup-error"]').should('be.visible');
  });

  it('shows a validation error when the password has no number', () => {
    fillAndSubmit('NoNumber!abcd');
    cy.get('[data-testid="signup-error"]').should('be.visible');
  });

  it('shows a validation error when the password has no special character', () => {
    fillAndSubmit('NoSpecialChar1');
    cy.get('[data-testid="signup-error"]').should('be.visible');
  });

  it('does not navigate away when client-side validation fails', () => {
    fillAndSubmit('weak');
    cy.url().should('include', '/auth/signup');
  });
});

describe('Signup page — navigation', () => {
  beforeEach(() => {
    cy.visit('/auth/signup');
  });

  it('has a link to the login page', () => {
    cy.get('a[href="/auth/login"]').should('exist');
  });

  it('navigates to /auth/login when the "Sign in" link is clicked', () => {
    cy.get('a[href="/auth/login"]').first().click();
    cy.url().should('include', '/auth/login');
  });
});
