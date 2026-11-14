import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  Paper,
  Container,
  Button,
  FocusTrap,
  Title,
  Text,
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import PasswordStrength from "../components/PasswordStrength";
import openSuccessDialog from "../components/openSuccessDialog";
import { publicApi } from "../api/client";
import { validatePassword } from "../validation/rules";

const ResetPassword = () => {
  const { user } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnChange: true,
    initialValues: {
      password: "",
      confirmPassword: "",
    },

    validate: {
      password: validatePassword,
      confirmPassword: (val, { password }) => {
        if (val !== password) {
          return "Passwords do not match";
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

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await publicApi.post(`auth/password-reset/reset/${token}`, {
        password: values.password,
      });
      openSuccessDialog({
        title: "Password reset successful",
        message:
          "Your password has been reset successfully. You can now login.",
        onOk: () => navigate("/", { replace: true }),
      });
    } catch {
      // The API client has shown the server's message or a network error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title order={2} mb="md">
          Reset password
        </Title>
        <Text mb="md">Enter your new password to reset your password.</Text>
        <FocusTrap active={true}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              handleSubmit(e);
            })}
          >
            <PasswordInput
              label="Password"
              placeholder="Password"
              {...form.getInputProps("password")}
              required
              size="md"
            />
            <PasswordInput
              label="Confirm password"
              placeholder="Confirm password"
              {...form.getInputProps("confirmPassword")}
              required
              size="md"
            />
            <PasswordStrength value={form.values.password} />
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              mt="xl"
              size="md"
            >
              Confirm
            </Button>
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
