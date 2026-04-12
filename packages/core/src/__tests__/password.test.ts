import { PASSWORD_REQUIREMENTS, validatePassword } from '../utils/password';

function getReq(id: string) {
  const req = PASSWORD_REQUIREMENTS.find((r) => r.id === id);
  if (req === undefined) throw new Error(`Requirement "${id}" not found`);
  return req;
}

describe('PASSWORD_REQUIREMENTS', () => {
  it('has exactly 5 requirements', () => {
    expect(PASSWORD_REQUIREMENTS).toHaveLength(5);
  });

  it('has the expected requirement ids', () => {
    const ids = PASSWORD_REQUIREMENTS.map((r) => r.id);
    expect(ids).toEqual(['length', 'uppercase', 'lowercase', 'number', 'special']);
  });

  describe('length requirement', () => {
    it('fails for passwords shorter than 8 characters', () => {
      const req = getReq('length');
      expect(req.test('Ab1!')).toBe(false);
      expect(req.test('Abc1!@#')).toBe(false);
    });

    it('passes for passwords of exactly 8 characters', () => {
      expect(getReq('length').test('Ab1!Ab1!')).toBe(true);
    });

    it('passes for passwords longer than 8 characters', () => {
      expect(getReq('length').test('SecurePass1!')).toBe(true);
    });
  });

  describe('uppercase requirement', () => {
    it('fails when no uppercase letter is present', () => {
      expect(getReq('uppercase').test('abcdefg1!')).toBe(false);
    });

    it('passes when at least one uppercase letter is present', () => {
      expect(getReq('uppercase').test('Abcdefg1!')).toBe(true);
      expect(getReq('uppercase').test('abcdefgA')).toBe(true);
    });
  });

  describe('lowercase requirement', () => {
    it('fails when no lowercase letter is present', () => {
      expect(getReq('lowercase').test('ABCDEFG1!')).toBe(false);
    });

    it('passes when at least one lowercase letter is present', () => {
      expect(getReq('lowercase').test('ABCDEFGa')).toBe(true);
    });
  });

  describe('number requirement', () => {
    it('fails when no digit is present', () => {
      expect(getReq('number').test('ABCDefgh!')).toBe(false);
    });

    it('passes when at least one digit is present', () => {
      expect(getReq('number').test('ABCDefg1')).toBe(true);
    });
  });

  describe('special character requirement', () => {
    const req = getReq('special');

    it('fails when no special character is present', () => {
      expect(req.test('ABCDefg1')).toBe(false);
    });

    it('passes for each supported special character', () => {
      const specials = '!@#$%^&*()-_=+[]{};\':"|,.<>/?`~';
      for (const ch of specials) {
        expect(req.test(`ABCDef1${ch}`)).toBe(true);
      }
    });
  });
});

describe('validatePassword', () => {
  describe('empty / very short passwords', () => {
    it('returns valid=false and score=0 for an empty string', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.unmetRequirements).toHaveLength(5);
    });

    it('returns valid=false for a password shorter than 8 characters', () => {
      const result = validatePassword('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.unmetRequirements.map((r) => r.id)).toContain('length');
    });
  });

  describe('missing individual requirements', () => {
    it('reports missing uppercase', () => {
      const result = validatePassword('abcdefg1!');
      expect(result.unmetRequirements.map((r) => r.id)).toContain('uppercase');
    });

    it('reports missing lowercase', () => {
      const result = validatePassword('ABCDEFG1!');
      expect(result.unmetRequirements.map((r) => r.id)).toContain('lowercase');
    });

    it('reports missing number', () => {
      const result = validatePassword('ABCDefgh!');
      expect(result.unmetRequirements.map((r) => r.id)).toContain('number');
    });

    it('reports missing special character', () => {
      const result = validatePassword('ABCDefg1');
      expect(result.unmetRequirements.map((r) => r.id)).toContain('special');
    });
  });

  describe('valid passwords', () => {
    it('returns valid=true and empty unmetRequirements for a strong password', () => {
      const result = validatePassword('Secure@Pass1');
      expect(result.valid).toBe(true);
      expect(result.unmetRequirements).toHaveLength(0);
      expect(result.score).toBe(5);
    });

    it('returns valid=true for the minimum viable strong password', () => {
      // exactly 8 chars, all requirements met
      const result = validatePassword('Abc1!xyz');
      expect(result.valid).toBe(true);
    });
  });

  describe('strength levels', () => {
    it('returns "weak" when 0 requirements are met', () => {
      expect(validatePassword('').strength).toBe('weak');
    });

    it('returns "weak" when only 1 requirement is met', () => {
      // Only lowercase met (short, all lowercase, no digits, no special)
      expect(validatePassword('a').strength).toBe('weak');
    });

    it('returns "fair" when exactly 2 requirements are met', () => {
      // length (8) + lowercase
      expect(validatePassword('abcdefgh').strength).toBe('fair');
    });

    it('returns "strong" when 3 requirements are met', () => {
      // length + lowercase + uppercase
      expect(validatePassword('abcdefgH').strength).toBe('strong');
    });

    it('returns "strong" when 4 requirements are met', () => {
      // length + lowercase + uppercase + number
      expect(validatePassword('abcdefgH1').strength).toBe('strong');
    });

    it('returns "very-strong" when all 5 requirements are met', () => {
      expect(validatePassword('SecurePass1!').strength).toBe('very-strong');
    });
  });

  describe('score is consistent with unmetRequirements', () => {
    it('score equals total requirements minus unmet count', () => {
      const result = validatePassword('abcdefgH');
      expect(result.score).toBe(PASSWORD_REQUIREMENTS.length - result.unmetRequirements.length);
    });
  });
});
