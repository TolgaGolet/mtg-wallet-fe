import { useState } from "react";
import {
  Modal,
  Alert,
  Group,
  Stack,
  Button,
  PasswordInput,
  TextInput,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { requirePassword, validateTotp } from "../../validation/rules";

export function SecureDeleteAccount({
  opened,
  onClose,
  onDelete,
  twoFactorEnabled,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      password: "",
      ...(twoFactorEnabled && { totpCode: "" }),
    },
    validate: {
      password: requirePassword,
      ...(twoFactorEnabled && { totpCode: validateTotp }),
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const deleteCredentials = {
        password: values.password,
        ...(twoFactorEnabled && { verificationCode: values.totpCode }),
      };

      await onDelete(deleteCredentials);
      onClose();
    } catch {
      // Keep the dialog open so the user can correct the password or code.
      // The API client has already shown the server's error message.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Account"
      closeOnClickOutside={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Warning!"
            color="red"
          >
            This action is permanent and cannot be undone. All your data will be
            permanently deleted. Please verify your identity to continue.
          </Alert>

          <PasswordInput
            required
            label="Current Password"
            placeholder="Enter your current password"
            {...form.getInputProps("password")}
            size="md"
          />

          {twoFactorEnabled && (
            <TextInput
              required
              label="2FA Code"
              placeholder="Enter your 6-digit 2FA code"
              maxLength={6}
              {...form.getInputProps("totpCode")}
              size="md"
            />
          )}

          <Text size="sm" c="dimmed">
            Please enter your current password
            {twoFactorEnabled && " and 2FA code"} to confirm account deletion
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose} size="md">
              Cancel
            </Button>
            <Button type="submit" color="red" loading={isLoading} size="md">
              Delete Account
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
