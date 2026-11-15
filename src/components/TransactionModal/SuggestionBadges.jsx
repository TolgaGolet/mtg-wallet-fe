import { Badge, rem } from "@mantine/core";

/** Quick-pick buttons under a select, e.g. recent payees or accounts. */
export default function SuggestionBadges({ items, ariaLabelPrefix, onSelect }) {
  return items.map((item) => (
    <Badge
      key={item.id}
      variant="light"
      mt="xs"
      mr={rem(5)}
      component="button"
      type="button"
      aria-label={`${ariaLabelPrefix} ${item.name}`}
      onClick={() => onSelect(item)}
      style={{ cursor: "pointer" }}
    >
      {item.name}
    </Badge>
  ));
}
