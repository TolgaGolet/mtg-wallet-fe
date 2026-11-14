import {
  ENTITY_NAME_REGEX,
  EMAIL_REGEX,
  isValidNameKeyword,
  LIMITS,
  passwordRequirements,
  PASSWORD_REGEX,
  requirePassword,
  TOTP_REGEX,
  USERNAME_REGEX,
  validateEmail,
  validateEntityName,
  validatePassword,
  validatePersonName,
  validateSurname,
  validateTotp,
  validateUsername,
} from "./rules";

/** java.util.regex \s without UNICODE_CHARACTER_CLASS: [ \t\n\x0B\f\r], as JS regex source */
const JAVA_WHITESPACE = " \\t\\n\\v\\f\\r";

// Copied from the backend (WalletUser, ValidationPatterns, TotpService, DomainLimits).
// If one of these fails, the frontend and backend rules have drifted apart: update both sides.
describe("rules match the backend", () => {
  test.each([
    [USERNAME_REGEX, "^[a-zA-Z0-9]+$"],
    [EMAIL_REGEX, "^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$"],
    [
      PASSWORD_REGEX,
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\\d!@#$%^&*(),.?":{}|<>]{8,64}$',
    ],
    [ENTITY_NAME_REGEX, "^[a-zA-Z0-9\\sçğıöşüÇĞİÖŞÜ]+$"],
    [TOTP_REGEX, "^\\d{6}$"],
  ])("%s", (regex, backendSource) => {
    // \/ in a JS regex literal is the same character as / in the Java string, and Java's \s
    // (ASCII whitespace only) is spelled out in JS, whose \s also matches Unicode spaces
    expect(regex.source.replaceAll("\\/", "/")).toBe(
      backendSource.replaceAll("\\s", JAVA_WHITESPACE)
    );
  });

  // Regression: JS \s accepted a non-breaking space that the backend's @Pattern rejects
  test("names with Unicode spaces are rejected like on the backend", () => {
    expect(validateEntityName("Market Store")).toBeNull();
    expect(validateEntityName("Market Store")).not.toBeNull();
    expect(validateEntityName("Market　Store")).not.toBeNull();
  });

  test("limits", () => {
    expect(LIMITS).toEqual({ accounts: 40, categories: 200, payees: 200 });
  });
});

describe("validators", () => {
  test("username: 3-15 letters or digits", () => {
    expect(validateUsername("abc")).toBeNull();
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("a".repeat(16))).not.toBeNull();
    expect(validateUsername("ab_c")).not.toBeNull();
  });

  test("email", () => {
    expect(validateEmail("a@b.co")).toBeNull();
    expect(validateEmail("not-an-email")).not.toBeNull();
    expect(validateEmail("a@" + "b".repeat(100))).not.toBeNull();
  });

  test("person name and surname", () => {
    expect(validatePersonName("Ada")).toBeNull();
    expect(validatePersonName("Al")).not.toBeNull();
    expect(validateSurname("")).toBeNull();
    expect(validateSurname("x".repeat(16))).not.toBeNull();
  });

  test("password follows the backend pattern, including the allowed characters", () => {
    expect(validatePassword("Abcdef1!")).toBeNull();
    expect(validatePassword("")).toBe("Password is required");
    expect(validatePassword("abcdef1!")).not.toBeNull(); // no uppercase
    // The old per-requirement checks accepted this, but the backend rejects the space
    expect(validatePassword("Abc def1!")).not.toBeNull();
  });

  test("existing passwords are only required, the server checks them", () => {
    expect(requirePassword("anything")).toBeNull();
    expect(requirePassword("")).toBe("Password is required");
  });

  test("password checklist", () => {
    expect(passwordRequirements("Abcdef1!")).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
    expect(passwordRequirements("")).toEqual({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
  });

  test("account, category and payee names allow Turkish letters in both cases", () => {
    expect(validateEntityName("Çiğköfte Şubesi İzmir")).toBeNull();
    expect(validateEntityName("ab")).not.toBeNull();
    expect(validateEntityName("bad-name")).not.toBeNull();
  });

  test("optional name keyword", () => {
    expect(isValidNameKeyword("")).toBe(true);
    expect(isValidNameKeyword("Market")).toBe(true);
    expect(isValidNameKeyword("x".repeat(51))).toBe(false);
  });

  test("TOTP code", () => {
    expect(validateTotp("123456")).toBeNull();
    expect(validateTotp("12345")).not.toBeNull();
    expect(validateTotp("")).not.toBeNull();
  });
});
