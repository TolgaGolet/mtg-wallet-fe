import { ActionIcon, Group, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

export default function PageTitle({
  isBackButtonVisible,
  value,
  titleOrder,
  ...props
}) {
  return (
    <Group justify="flex-start" align="center" gap="xs" mb="md" {...props}>
      {isBackButtonVisible && (
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => window.history.back()}
          aria-label="Go back"
        >
          <IconArrowLeft />
        </ActionIcon>
      )}
      <Title order={titleOrder || 2}>{value}</Title>
    </Group>
  );
}
