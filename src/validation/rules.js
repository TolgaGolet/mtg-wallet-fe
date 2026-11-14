// Form rules shared by every page. They mirror the backend's request validation, so keep them in sync
// with mtg-wallet-be: WalletUser (username, email, name, password), api/request/ValidationPatterns
// (account/category/payee names), TotpService (TOTP code) and service/DomainLimits (LIMITS).

export const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
export const USERNAME_LENGTH = { min: 3, max: 15 };

export const EMAIL_REGEX = /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/;
export const EMAIL_LENGTH = { min: 3, max: 100 };

export const PERSON_NAME_LENGTH = { min: 3, max: 15 };
export const SURNAME_MAX_LENGTH = 15;

export const PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>';
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,64}$/;

/**
 * Account, category and payee names: letters (incl. Turkish), digits and spaces. The backend's \s is
 * Java's, which is ASCII whitespace only; JS \s also matches Unicode spaces (e.g. a pasted NBSP),
 * so Java's set is spelled out here.
 */
export const ENTITY_NAME_REGEX = /^[a-zA-Z0-9 \t\n\v\f\rçğıöşüÇĞİÖŞÜ]+$/;
export const ENTITY_NAME_LENGTH = { min: 3, max: 50 };

export const TOTP_REGEX = /^\d{6}$/;

export const LIMITS = { accounts: 40, categories: 200, payees: 200 };

const between = (val, { min, max }) =>
  typeof val === "string" && val.length >= min && val.length <= max;

/** Each requirement separately, for the password checklist in the UI. */
export function passwordRequirements(val = "") {
  return {
    length: val.length >= 8 && val.length <= 64,
    uppercase: /[A-Z]/.test(val),
    lowercase: /[a-z]/.test(val),
    number: /\d/.test(val),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(val),
  };
}

/** Checklist labels, keyed like passwordRequirements(). */
export const PASSWORD_REQUIREMENT_LABELS = {
  length: "8-64 characters long",
  uppercase: "Contains an uppercase letter",
  lowercase: "Contains a lowercase letter",
  number: "Contains a number",
  special: "Contains a special character",
};

// Mantine form validators: return an error message or null

export const validateUsername = (val) =>
  between(val, USERNAME_LENGTH) && USERNAME_REGEX.test(val)
    ? null
    : "Username must be 3-15 characters long and contain only letters and numbers";

export const validateEmail = (val) =>
  between(val, EMAIL_LENGTH) && EMAIL_REGEX.test(val)
    ? null
    : "Email must be 3-100 characters and should be valid";

export const validatePersonName = (val) =>
  between(val, PERSON_NAME_LENGTH) ? null : "Name must be 3-15 characters long";

export const validateSurname = (val) =>
  !val || val.length <= SURNAME_MAX_LENGTH
    ? null
    : "Surname must be 0-15 characters long";

export const validatePassword = (val) => {
  if (!val) return "Password is required";
  return PASSWORD_REGEX.test(val)
    ? null
    : `Password must be 8-64 characters with an uppercase letter, a lowercase letter, a number and one of ${PASSWORD_SPECIAL_CHARACTERS}, and no other characters`;
};

/** For logging in or confirming an existing password: the server decides whether it's right. */
export const requirePassword = (val) => (val ? null : "Password is required");

export const validateEntityName = (val) =>
  between(val, ENTITY_NAME_LENGTH) && ENTITY_NAME_REGEX.test(val)
    ? null
    : "Name must be 3-50 characters long and contain only letters, numbers and spaces";

/** Optional search keyword: empty, or a valid name of at most 50 characters. */
export const isValidNameKeyword = (val) =>
  !val || (val.length <= ENTITY_NAME_LENGTH.max && ENTITY_NAME_REGEX.test(val));

export const validateTotp = (val) => {
  if (!val) return "Verification code is required";
  return TOTP_REGEX.test(val)
    ? null
    : "Verification code must be a 6-digit number";
};
