import { Group, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

export default function PageTitle({
  isBackButtonVisible,
  value,
  titleOrder,
  ...props
}) {
  return (
    <Group justify="flex-start" align="center" gap="xs" mb="md" {...props}>
      {!isBackButtonVisible || (
        <IconArrowLeft
          onClick={() => window.history.back()}
          style={{ cursor: "pointer" }}
        />
      )}
      <Title order={titleOrder || 2}>{value}</Title>
    </Group>
  );
}
