/** Industry-standard password requirements (OWASP-aligned). */
export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A–Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a–z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'One number (0–9)',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'One special character (!@#$%^&*…)',
    test: (p) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(p),
  },
] as const;

export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface PasswordValidationResult {
  valid: boolean;
  /** Requirements that have not yet been satisfied. */
  unmetRequirements: PasswordRequirement[];
  strength: PasswordStrength;
  /** Number of requirements currently met (0–5). */
  score: number;
}

/**
 * Validates a password against all PASSWORD_REQUIREMENTS.
 * Returns validity, unmet requirements, a 0-5 score, and a strength label.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const unmetRequirements = PASSWORD_REQUIREMENTS.filter((req) => !req.test(password));
  const score = PASSWORD_REQUIREMENTS.length - unmetRequirements.length;
  const valid = unmetRequirements.length === 0;

  let strength: PasswordStrength;
  if (score <= 1) strength = 'weak';
  else if (score <= 2) strength = 'fair';
  else if (score <= 4) strength = 'strong';
  else strength = 'very-strong';

  return { valid, unmetRequirements, strength, score };
}
