import { Button, Center, Group, rem, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconCheck } from "@tabler/icons-react";

/**
 * The confirmation dialog the auth flows show after a successful request
 * (sign-up, password reset, account recovery, resent verification email).
 * It can only be closed with its button, which runs `onOk`.
 */
export default function openSuccessDialog({ title, message, onOk }) {
  modals.open({
    title,
    centered: true,
    children: (
      <>
        <Center>
          <IconCheck
            aria-hidden
            style={{ width: rem(125), height: rem(125), color: "teal" }}
          />
        </Center>
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button
            onClick={() => {
              modals.closeAll();
              onOk?.();
            }}
            mt="md"
            data-autofocus
          >
            Okay
          </Button>
        </Group>
      </>
    ),
    withCloseButton: false,
    closeOnClickOutside: false,
    closeOnEscape: false,
    size: "lg",
  });
}
