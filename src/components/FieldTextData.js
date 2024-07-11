import { Text } from "@mantine/core";

export default function FieldTextData({ children, ...props }) {
  return (
    <Text c="dimmed" ml="xs" {...props}>
      {children}
    </Text>
  );
}
