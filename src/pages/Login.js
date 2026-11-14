import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
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
  Stack,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  requirePassword,
  TOTP_REGEX,
  validateTotp,
  validateUsername,
} from "../validation/rules";
import { IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import showNotification from "../components/showNotification";
import openSuccessDialog from "../components/openSuccessDialog";
import { publicApi } from "../api/client";

const NO_ERROR = { isErrorState: false, isEmailVerificationRequired: false };

const Login = () => {
  const { loginUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({ ...NO_ERROR, message: "" });
  const [isTotpRequired, setIsTotpRequired] = useState(false);
  const [showResendButton, { toggle: toggleResendButton }] =
    useDisclosure(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      password: "",
      verificationCode: "",
    },

    validate: {
      username: validateUsername,
      // Only required here: the server decides whether the password is right
      password: requirePassword,
      verificationCode: (val) => (isTotpRequired ? validateTotp(val) : null),
    },
  });

  // Logging in sets `user`, which brings the user to Home
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleResendClick = async () => {
    setIsLoading(true);
    try {
      await publicApi.post(
        `${process.env.REACT_APP_RESEND_VERIFY_EMAIL_URL}/${form.values.username}`
      );
      openSuccessDialog({
        title: "Verification link resent",
        message:
          "We have sent an email verification link to your email inbox. Please click the link to verify your email address. Then you will be able to login.",
        onOk: () => navigate("/", { replace: true }),
      });
    } catch {
      // The API client has shown the error
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = () => (
    <Alert variant="light" color="red" title="Error" icon={<IconX />} mb="md">
      {errorData.message}
      {errorData.isEmailVerificationRequired && (
        <Stack gap="sm" mt="md" align="flex-start">
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={toggleResendButton}
          >
            Didn't receive a verification link?
          </Anchor>
          {showResendButton && (
            <Button
              variant="light"
              onClick={handleResendClick}
              loading={isLoading}
            >
              Resend
            </Button>
          )}
        </Stack>
      )}
    </Alert>
  );

  const formOnSubmit = async (values) => {
    setIsLoading(true);
    const result = await loginUser(values);
    setIsLoading(false);
    if (result.status === "ok") {
      showNotification("You have been successfully signed in", "success");
    } else if (result.status === "totp") {
      setErrorData({ ...NO_ERROR, message: "" });
      setIsTotpRequired(true);
    } else if (result.message) {
      // Without a message it was a network error, which the client has already shown
      setErrorData({
        isErrorState: true,
        isEmailVerificationRequired: result.isEmailVerificationRequired,
        message: result.message,
      });
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {errorData.isErrorState ? renderError() : null}
        <FocusTrap active={true}>
          <form onSubmit={form.onSubmit(formOnSubmit)}>
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
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    form.setFieldValue("verificationCode", value);
                    // Sign in as soon as the 6-digit code is complete
                    if (TOTP_REGEX.test(value) && !isLoading) {
                      formOnSubmit({
                        ...form.getValues(),
                        verificationCode: value,
                      });
                    }
                  }}
                  required
                  size="md"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
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
                  <Anchor component={Link} to="/register" replace size="sm">
                    Don't have an account?
                  </Anchor>
                </Group>
                <Group justify="space-between" mt="xs">
                  <Anchor component={Link} to="/forgot-password" size="sm">
                    Forgot password?
                  </Anchor>
                </Group>
              </>
            ) : (
              <Group justify="space-between" mt="lg">
                <Anchor component={Link} to="/account-recovery" size="sm">
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
