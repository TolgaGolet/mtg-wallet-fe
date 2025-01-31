import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  PasswordInput,
  Anchor,
  Paper,
  Container,
  Group,
  Button,
  FocusTrap,
  Alert,
  Text,
  Center,
  rem,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { modals } from "@mantine/modals";

const Login = () => {
  let { loginUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({
    isErrorState: false,
    isEmailVerificationRequired: false,
    message: "",
  });
  const [isTotpRequired, setIsTotpRequired] = useState(false);
  const [showResendButton, { toggle: toggleResendButton }] =
    useDisclosure(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      password: "",
    },

    validate: {
      username: (val) =>
        val?.length > 15 || val?.length < 3 || !/^[a-zA-Z0-9]+$/.test(val)
          ? "Username must be 3-15 characters and contain only letters and numbers"
          : null,
      password: (val) => {
        if (!val) {
          return "Password is required";
        }
        const length = val.length >= 8 && val.length <= 64;
        const uppercase = /[A-Z]/.test(val);
        const lowercase = /[a-z]/.test(val);
        const number = /\d/.test(val);
        const special = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        if (!length || !uppercase || !lowercase || !number || !special) {
          return "Password must be 8-64 characters long and contain at least one uppercase letter, one lowercase letter, one digit and one special character";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleResendClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_RESEND_VERIFY_EMAIL_URL}/${form.values.username}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        modals.open({
          title: "Verification code resent",
          centered: true,
          children: (
            <>
              <Center>
                <IconCheck
                  style={{
                    width: rem(125),
                    height: rem(125),
                    color: "teal",
                  }}
                />
              </Center>
              <Text>
                We have sent an email verification link to your email inbox.
                Please click the link to verify your email address. Then you
                will be able to login.
              </Text>
              <Group position="apart" justify="flex-end">
                <Button
                  onClick={() => {
                    modals.closeAll();
                    navigate("/", { replace: true });
                  }}
                  mt="md"
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
      } else {
        const message = await response.text();
        showNotification(message, "error");
      }
    } catch (error) {
      showNotification("Something went wrong! " + error.toString(), "error");
    }
  };

  const renderError = () => {
    if (!errorData.isEmailVerificationRequired) {
      return (
        <Alert variant="light" color="red" title="Error" icon={<IconX />}>
          {errorData.message}
        </Alert>
      );
    } else {
      return (
        <Alert variant="light" color="red" title="Error" icon={<IconX />}>
          {errorData.message}
          <Text
            size="sm"
            style={{ cursor: "pointer" }}
            c={"blue"}
            onClick={toggleResendButton}
            mt="md"
            mb="md"
          >
            Didn't receive a verification link?
          </Text>
          {showResendButton && (
            <Button
              variant="light"
              onClick={handleResendClick}
              loading={isLoading}
            >
              Resend
            </Button>
          )}
        </Alert>
      );
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {errorData.isErrorState ? renderError() : null}
        <FocusTrap active={true}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              loginUser(e, setIsLoading, setErrorData, setIsTotpRequired);
            })}
          >
            {!isTotpRequired ? (
              <>
                <TextInput
                  label="Username"
                  placeholder="Username"
                  {...form.getInputProps("username")}
                  required
                  size="md"
                />
                <PasswordInput
                  label="Password"
                  placeholder="Password"
                  {...form.getInputProps("password")}
                  required
                  mt="md"
                  size="md"
                />
              </>
            ) : (
              <>
                <Title order={3} mb="md">
                  Two-Factor Authentication
                </Title>
                <TextInput
                  label="Verification code"
                  placeholder="Verification code"
                  {...form.getInputProps("verificationCode")}
                  required
                  size="md"
                  maxLength={6}
                  autoFocus
                />
              </>
            )}
            <Button
              type="submit"
              loading={isLoading}
              disabled={
                isTotpRequired && form.values.verificationCode?.length !== 6
              }
              fullWidth
              mt="xl"
              size="md"
            >
              Sign in
            </Button>
            {!isTotpRequired ? (
              <>
                <Group justify="space-between" mt="lg">
                  <Anchor
                    onClick={() => navigate("/register", { replace: true })}
                    component="button"
                    size="sm"
                  >
                    Don't have an account?
                  </Anchor>
                </Group>
                <Group justify="space-between" mt="xs">
                  <Anchor
                    onClick={() =>
                      navigate("/forgot-password", { replace: false })
                    }
                    component="button"
                    size="sm"
                  >
                    Forgot password?
                  </Anchor>
                </Group>
              </>
            ) : (
              <Group justify="space-between" mt="lg">
                <Anchor
                  onClick={() =>
                    navigate("/account-recovery", { replace: false })
                  }
                  component="button"
                  size="sm"
                >
                  Don't have access to the authenticator?
                </Anchor>
              </Group>
            )}
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default Login;
