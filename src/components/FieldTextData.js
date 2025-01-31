import { Text } from "@mantine/core";

export default function FieldTextData({ children, ...props }) {
  return (
    <Text fw="500" c="dimmed" ml="xs" {...props}>
      {children}
    </Text>
  );
}
