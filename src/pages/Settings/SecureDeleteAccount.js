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
import showNotification from "../../components/showNotification";

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
      password: (val) => (!val ? "Password is required" : null),
      ...(twoFactorEnabled && {
        totpCode: (val) => {
          if (!val) return "TOTP code is required";
          if (!/^\d{6}$/.test(val)) return "TOTP code must be 6 digits";
          return null;
        },
      }),
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
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to delete account",
        "error"
      );
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
        <Stack spacing="md">
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
          />

          {twoFactorEnabled && (
            <TextInput
              required
              label="2FA Code"
              placeholder="Enter your 6-digit 2FA code"
              maxLength={6}
              {...form.getInputProps("totpCode")}
            />
          )}

          <Text size="sm" c="dimmed">
            Please enter your current password
            {twoFactorEnabled && " and 2FA code"} to confirm account deletion
          </Text>

          <Group position="right" mt="md">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="red" loading={isLoading}>
              Delete Account
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
