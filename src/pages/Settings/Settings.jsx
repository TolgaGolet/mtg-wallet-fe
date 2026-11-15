import { useContext, useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Box,
  Title,
  Switch,
  Modal,
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

/** The fields UpdateSettingsRequest accepts; a user registered without a surname has null there */
const toProfile = (data) => ({
  email: data?.email ?? "",
  name: data?.name ?? "",
  surname: data?.surname ?? "",
});

const SettingsPage = () => {
  // Separate flags, so saving the profile doesn't show a spinner in the password dialog
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
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
        userInfoForm.setValues(toProfile(data));
      },
    }
  );
  const isLoading = settingsQuery.loading || isSavingProfile;
  const loadError = Boolean(settingsQuery.error);

  const handleChangeUserInfo = (values) => {
    setIsSavingProfile(true);
    callApi
      .post("settings/update", toProfile(values))
      .then(() => {
        setIsSavingProfile(false);
        showNotification(
          "Settings saved successfully. If you changed your email address, you need to verify your new email",
          "success"
        );
      })
      .catch(() => setIsSavingProfile(false));
  };

  // Typed passwords must not survive closing the dialog
  const closePasswordDialog = () => {
    changePasswordForm.reset();
    closePasswordModal();
  };

  // The backend revokes every session on a password change (this one too), so the user logs in again
  const handleChangePassword = ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    setIsSavingPassword(true);
    callApi
      .post("user/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      .then(() => {
        setIsSavingPassword(false);
        closePasswordDialog();
        logoutUser("Password changed. Please log in again");
      })
      .catch(() => setIsSavingPassword(false));
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
          <form onSubmit={userInfoForm.onSubmit(handleChangeUserInfo)}>
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
          <Switch
            label="Two-Factor Authentication (TOTP)"
            labelPosition="left"
            checked={twoFactorEnabled}
            disabled={isLoading || loadError}
            onChange={() => openTwoFactorModal()}
            size="md"
            fw={500}
            styles={{ body: { justifyContent: "space-between" } }}
          />
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
          onClose={closePasswordDialog}
          title="Change Password"
          closeOnClickOutside={false}
        >
          <Stack gap="sm">
            <form onSubmit={changePasswordForm.onSubmit(handleChangePassword)}>
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
              <Button
                type="submit"
                loading={isSavingPassword}
                mt="lg"
                size="md"
              >
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
