// Case-insensitive text helpers.
//
// Names are often Turkish, where "I" lowercases to "ı" and "İ" to "i". Search therefore folds
// with both Turkish rules and the browser's locale and matches if either does, so Turkish and
// non-Turkish users both find what they type.

const TURKISH = "tr-TR";

const foldings = (value) => {
  const text = (value ?? "").trim();
  return [text.toLocaleLowerCase(TURKISH), text.toLocaleLowerCase()];
};

/** True when `text` contains `search`, ignoring case under Turkish or browser-locale rules. */
export function includesIgnoringCase(text, search) {
  const [textTr, textLocal] = foldings(text);
  const [searchTr, searchLocal] = foldings(search);
  return textTr.includes(searchTr) || textLocal.includes(searchLocal);
}

/**
 * Same rule as the backend's Names.sameName (Turkish locale), so the UI's "already exists"
 * checks agree with what the server will accept.
 */
export function sameName(a, b) {
  return (
    (a ?? "").trim().toLocaleLowerCase(TURKISH) ===
    (b ?? "").trim().toLocaleLowerCase(TURKISH)
  );
}
