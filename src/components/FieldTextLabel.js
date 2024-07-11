import { Text } from "@mantine/core";

export default function FieldTextLabel({ children, ...props }) {
  return (
    <Text fw="700" mt="xs" {...props}>
      {children}
    </Text>
  );
}
