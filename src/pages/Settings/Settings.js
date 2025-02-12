import React, { useEffect, useState } from "react";
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
  Progress,
  List,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconX } from "@tabler/icons-react";
import { TotpSetup } from "./TotpSetup";
import useAxios from "../../utils/useAxios";
import showNotification from "../../components/showNotification";
import { hasLength, useForm } from "@mantine/form";
import { SecureDeleteAccount } from "./SecureDeleteAccount";

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
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
  const [settingsData, setSettingsData] = useState({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const requirementsList = [
    {
      label: "8-64 characters long",
      isMet: passwordRequirements.length,
    },
    {
      label: "Contains an uppercase letter",
      isMet: passwordRequirements.uppercase,
    },
    {
      label: "Contains a lowercase letter",
      isMet: passwordRequirements.lowercase,
    },
    {
      label: "Contains a number",
      isMet: passwordRequirements.number,
    },
    {
      label: "Contains a special character",
      isMet: passwordRequirements.special,
    },
  ];

  const progressValue =
    (Object.values(passwordRequirements).filter(Boolean).length / 5) * 100;

  useEffect(() => {
    callApi.get("settings").then((response) => {
      setSettingsData(response.data);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTwoFactorEnabled(settingsData.totpEnabled);
    userInfoForm.setValues(settingsData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsData]);

  const userInfoForm = useForm({
    validateInputOnBlur: true,
    initialValues: {
      email: "",
      name: "",
      surname: "",
      totpEnabled: false,
    },

    validate: {
      email: (val) =>
        val?.length > 100 ||
        val?.length < 3 ||
        !/^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/.test(val)
          ? "Email must be 3-100 characters and should be valid"
          : null,
      name: hasLength({ min: 3, max: 15 }, "Name must be 3-15 characters long"),
      surname: hasLength(
        { min: 0, max: 15 },
        "Surname must be 0-15 characters long"
      ),
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
      currentPassword: (val) => {
        if (!val) {
          return "Password is required";
        }
        const length = val.length >= 8 && val.length <= 64;
        const uppercase = /[A-Z]/.test(val);
        const lowercase = /[a-z]/.test(val);
        const number = /\d/.test(val);
        const special = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        if (!length || !uppercase || !lowercase || !number || !special) {
          return "Password does not meet requirements";
        }
        return null;
      },
      newPassword: (val) => {
        if (!val) {
          setPasswordRequirements({
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false,
          });
          return "Password is required";
        }
        const length = val.length >= 8 && val.length <= 64;
        const uppercase = /[A-Z]/.test(val);
        const lowercase = /[a-z]/.test(val);
        const number = /\d/.test(val);
        const special = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        setPasswordRequirements({
          length,
          uppercase,
          lowercase,
          number,
          special,
        });
        if (!length || !uppercase || !lowercase || !number || !special) {
          return "Password does not meet requirements";
        }
        return null;
      },
      confirmPassword: (val, { newPassword }) => {
        if (val !== newPassword) {
          return "Passwords do not match";
        }
        return null;
      },
    },
  });

  const handleChangeUserInfo = (request) => {
    callApi
      .post("settings/update", request)
      .then((response) => {
        setIsLoading(false);
        showNotification(
          "Settings saved successfully. If you changed your email address, you need to verify your new email",
          "success"
        );
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const handleChangePassword = (request) => {
    callApi
      .post("user/change-password", request)
      .then((response) => {
        setIsLoading(false);
        showNotification("Password changed successfully", "success");
        closePasswordModal();
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const handleDeleteAccount = async (credentials) => {
    setIsLoading(true);
    try {
      await callApi.delete("settings/account", {
        data: credentials,
      });

      await new Promise((resolve) => {
        showNotification("Account deleted successfully", "success");
        // Give the notification a small delay to ensure it's visible
        setTimeout(resolve, 500);
      });

      window.location.reload();
    } catch (error) {
      console.error("Account deletion error:", error);
      showNotification(
        error.response?.data?.message || "Failed to delete account",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="sm">
      <Box p={{ base: "md", sm: "xl" }}>
        <Title order={2} mb="md" align="center">
          Settings
        </Title>
        <Stack spacing="sm">
          <form
            onSubmit={userInfoForm.onSubmit((e) => {
              setIsLoading(true);
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
            <Button type="submit" loading={isLoading} mt="lg" size="md">
              Save Settings
            </Button>
          </form>
          <Group position="apart">
            <Text weight={500}>Two-Factor Authentication (TOTP)</Text>
            <Switch
              checked={twoFactorEnabled}
              disabled={isLoading}
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
          <Stack spacing="sm">
            <form
              onSubmit={changePasswordForm.onSubmit((e) => {
                setIsLoading(true);
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
              <Progress
                value={progressValue}
                size="sm"
                color={progressValue === 100 ? "green" : "blue"}
                mt="xs"
              />
              <List mt="xs" type="unordered">
                {requirementsList.map((req) => (
                  <List.Item
                    key={req.label}
                    icon={
                      <ThemeIcon
                        color={req.isMet ? "green" : "red"}
                        size={16}
                        radius="xl"
                      >
                        {req.isMet ? (
                          <IconCheck size={10} />
                        ) : (
                          <IconX size={10} />
                        )}
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c={req.isMet ? "gray" : "red"}>
                      {req.label}
                    </Text>
                  </List.Item>
                ))}
              </List>
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
          />
        </Modal>
      </Box>
    </Container>
  );
};

export default SettingsPage;
