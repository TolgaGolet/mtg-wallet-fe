import React, { useContext, useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  Box,
  Title,
  Switch,
  Modal,
  Text,
  Container,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { TotpSetup } from "./TotpSetup";
import useAxios from "../../utils/useAxios";
import showNotification from "../../components/showNotification";
import { useForm } from "@mantine/form";
import PasswordStrength from "../../components/PasswordStrength";
import { SecureDeleteAccount } from "./SecureDeleteAccount";
import AuthContext from "../../context/AuthContext";
import LoadError from "../../components/LoadError";
import useApiQuery from "../../utils/useApiQuery";
import {
  requirePassword,
  validateEmail,
  validatePassword,
  validatePersonName,
  validateSurname,
} from "../../validation/rules";

const SettingsPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { logoutUser } = useContext(AuthContext);
  const [
    passwordModalOpened,
    { open: openPasswordModal, close: closePasswordModal },
  ] = useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [
    twoFactorModalOpened,
    { open: openTwoFactorModal, close: closeTwoFactorModal },
  ] = useDisclosure(false);
  const callApi = useAxios();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const userInfoForm = useForm({
    validateInputOnBlur: true,
    initialValues: {
      email: "",
      name: "",
      surname: "",
      totpEnabled: false,
    },

    validate: {
      email: validateEmail,
      name: validatePersonName,
      surname: validateSurname,
    },
  });

  const changePasswordForm = useForm({
    validateInputOnChange: true,
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },

    validate: {
      // The server checks whether the current password is right
      currentPassword: requirePassword,
      newPassword: validatePassword,
      confirmPassword: (val, { newPassword }) => {
        if (val !== newPassword) {
          return "Passwords do not match";
        }
        return null;
      },
    },
  });

  const settingsQuery = useApiQuery(
    (signal) => callApi.get("settings", { signal }).then((r) => r.data),
    [],
    {
      onSuccess: (data) => {
        setTwoFactorEnabled(Boolean(data?.totpEnabled));
        userInfoForm.setValues(data);
      },
    }
  );
  const isLoading = settingsQuery.loading || isSaving;
  const loadError = Boolean(settingsQuery.error);

  const handleChangeUserInfo = (request) => {
    callApi
      .post("settings/update", request)
      .then(() => {
        setIsSaving(false);
        showNotification(
          "Settings saved successfully. If you changed your email address, you need to verify your new email",
          "success"
        );
      })
      .catch(() => setIsSaving(false));
  };

  const handleChangePassword = (request) => {
    callApi
      .post("user/change-password", request)
      .then(() => {
        setIsSaving(false);
        showNotification("Password changed successfully", "success");
        closePasswordModal();
      })
      .catch(() => setIsSaving(false));
  };

  // Errors propagate so the dialog stays open; the API client has already shown the server's message.
  // Logging out clears the deleted user's tokens, which the backend has already revoked.
  const handleDeleteAccount = async (credentials) => {
    await callApi.delete("settings/account", { data: credentials });
    logoutUser("Your account has been deleted");
  };

  return (
    <Container size="sm">
      <Box p={{ base: "md", sm: "xl" }}>
        <Title order={2} mb="md" ta="center">
          Settings
        </Title>
        {loadError && (
          <LoadError
            mb="md"
            title="Couldn't load your settings"
            onRetry={settingsQuery.retry}
          />
        )}
        <Stack gap="sm">
          <form
            onSubmit={userInfoForm.onSubmit((e) => {
              setIsSaving(true);
              handleChangeUserInfo(e);
            })}
          >
            <TextInput
              label="Email"
              {...userInfoForm.getInputProps("email")}
              required
              size="md"
            />
            <TextInput
              label="Name"
              {...userInfoForm.getInputProps("name")}
              required
              size="md"
            />
            <TextInput
              label="Surname"
              {...userInfoForm.getInputProps("surname")}
              size="md"
            />
            <Button
              type="submit"
              loading={isLoading}
              disabled={loadError}
              mt="lg"
              size="md"
            >
              Save Settings
            </Button>
          </form>
          <Group justify="space-between">
            <Text fw={500}>Two-Factor Authentication (TOTP)</Text>
            <Switch
              checked={twoFactorEnabled}
              disabled={isLoading || loadError}
              onChange={() => openTwoFactorModal()}
              size="md"
            />
          </Group>
        </Stack>
        <Stack align="flex-start" justify="center" gap="xs" mt="md">
          <Button onClick={openPasswordModal} size="md">
            Change Password
          </Button>
          <Button color="red" onClick={openDeleteModal} size="md">
            Delete Account
          </Button>
        </Stack>
        <Modal
          opened={passwordModalOpened}
          onClose={closePasswordModal}
          title="Change Password"
          closeOnClickOutside={false}
        >
          <Stack gap="sm">
            <form
              onSubmit={changePasswordForm.onSubmit((e) => {
                setIsSaving(true);
                handleChangePassword(e);
              })}
            >
              <PasswordInput
                label="Current Password"
                placeholder="Current Password"
                {...changePasswordForm.getInputProps("currentPassword")}
                required
                size="md"
              />
              <PasswordInput
                label="New Password"
                placeholder="New Password"
                {...changePasswordForm.getInputProps("newPassword")}
                required
                size="md"
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm Password"
                {...changePasswordForm.getInputProps("confirmPassword")}
                required
                size="md"
              />
              <PasswordStrength value={changePasswordForm.values.newPassword} />
              <Button type="submit" loading={isLoading} mt="lg" size="md">
                Change Password
              </Button>
            </form>
          </Stack>
        </Modal>
        <SecureDeleteAccount
          opened={deleteModalOpened}
          onClose={closeDeleteModal}
          onDelete={handleDeleteAccount}
          twoFactorEnabled={twoFactorEnabled}
        />
        <Modal opened={twoFactorModalOpened} onClose={closeTwoFactorModal}>
          <TotpSetup
            close={closeTwoFactorModal}
            twoFactorEnabled={twoFactorEnabled}
            onChange={setTwoFactorEnabled}
          />
        </Modal>
      </Box>
    </Container>
  );
};

export default SettingsPage;
