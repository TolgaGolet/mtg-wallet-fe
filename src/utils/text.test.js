import { includesIgnoringCase, sameName } from "./text";

describe("includesIgnoringCase", () => {
  test("ignores case", () => {
    expect(includesIgnoringCase("Market", "mar")).toBe(true);
    expect(includesIgnoringCase("Market", "xyz")).toBe(false);
  });

  test("Turkish users: typing ı or i finds names with I or İ", () => {
    expect(includesIgnoringCase("IŞIK", "ışık")).toBe(true);
    expect(includesIgnoringCase("İzmir", "izmir")).toBe(true);
  });

  test("non-Turkish users: typing i finds names with a capital I", () => {
    expect(includesIgnoringCase("Istanbul", "istanbul")).toBe(true);
  });

  test("an empty search matches everything", () => {
    expect(includesIgnoringCase("Market", "")).toBe(true);
    expect(includesIgnoringCase(undefined, "")).toBe(true);
  });
});

describe("sameName (matches the backend's Names.sameName)", () => {
  test("Turkish case folding and trimming", () => {
    expect(sameName(" IŞIK ", "ışık")).toBe(true);
    expect(sameName("İzmir", "izmir")).toBe(true);
  });

  test("I and i are different names under Turkish rules", () => {
    expect(sameName("Istanbul", "istanbul")).toBe(false);
  });
});
