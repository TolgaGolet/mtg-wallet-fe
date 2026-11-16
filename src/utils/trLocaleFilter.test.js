import { trLocaleFilter } from "./trLocaleFilter";

const options = [
  { value: "1", label: "İstanbul Market" },
  { value: "2", label: "Izmir Fuel" },
  { value: "3", label: "Rent" },
];

test("matches labels case-insensitively with Turkish dotted/dotless i", () => {
  expect(trLocaleFilter({ options, search: "istanbul" })).toEqual([options[0]]);
});

test("an empty search keeps every option", () => {
  expect(trLocaleFilter({ options, search: "" })).toEqual(options);
});

test("no match yields an empty list", () => {
  expect(trLocaleFilter({ options, search: "groceries" })).toEqual([]);
});
