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
import {
  requirePassword,
  TOTP_INPUT_PROPS,
  validateTotp,
} from "../../validation/rules";

/**
 * The account-deletion dialog. Its form is mounted only while the dialog is open (Mantine's Modal
 * unmounts closed content), so a typed password never survives closing it, and each opening is
 * built for the current 2FA state (Settings opens it only once that is known). It can't be closed
 * while the delete runs: that would look like a cancel while the account is still deleted.
 */
export function SecureDeleteAccount({
  opened,
  onClose,
  onDelete,
  twoFactorEnabled,
}) {
  // Kept here, not in the form, so it is reset even when a successful delete unmounts the form
  const [isDeleting, setIsDeleting] = useState(false);

  const close = () => {
    if (!isDeleting) onClose();
  };

  const handleDelete = async (credentials) => {
    setIsDeleting(true);
    try {
      await onDelete(credentials);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Delete Account"
      closeOnClickOutside={false}
      closeOnEscape={!isDeleting}
      withCloseButton={!isDeleting}
    >
      <DeleteAccountForm
        onCancel={close}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        twoFactorEnabled={twoFactorEnabled}
      />
    </Modal>
  );
}

function DeleteAccountForm({
  onCancel,
  onDelete,
  isDeleting,
  twoFactorEnabled,
}) {
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
    try {
      await onDelete({
        password: values.password,
        ...(twoFactorEnabled && { verificationCode: values.totpCode }),
      });
    } catch {
      // Keep the dialog open so the user can correct the password or code.
      // The API client has already shown the server's error message.
    }
  };

  return (
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
            {...TOTP_INPUT_PROPS}
            {...form.getInputProps("totpCode")}
            size="md"
          />
        )}

        <Text size="sm" c="dimmed">
          Please enter your current password
          {twoFactorEnabled && " and 2FA code"} to confirm account deletion
        </Text>

        <Group justify="flex-end" mt="md">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            size="md"
          >
            Cancel
          </Button>
          <Button type="submit" color="red" loading={isDeleting} size="md">
            Delete Account
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
