import { idString, toId } from "./ids";

test("idString turns ids into Select values and keeps empty ids null", () => {
  expect(idString(7)).toBe("7");
  expect(idString(0)).toBe("0");
  expect(idString(null)).toBeNull();
  expect(idString(undefined)).toBeNull();
});

test("toId turns Select values into numbers and empty values into null", () => {
  expect(toId("7")).toBe(7);
  expect(toId("")).toBeNull();
  expect(toId(null)).toBeNull();
});
