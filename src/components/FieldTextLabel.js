import { Text } from "@mantine/core";

export default function FieldTextLabel({ children, ...props }) {
  return (
    <Text fw="500" mt="xs" {...props}>
      {children}
    </Text>
  );
}
