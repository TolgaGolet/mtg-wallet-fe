import { includesIgnoringCase } from "./text";

/** Case-insensitive option filter for Mantine selects (Turkish and browser-locale aware). */
export const trLocaleFilter = ({ options, search }) =>
  options.filter((option) => includesIgnoringCase(option.label, search));
