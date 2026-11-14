import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  Paper,
  Container,
  Button,
  FocusTrap,
  Title,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import openSuccessDialog from "../components/openSuccessDialog";
import { publicApi } from "../api/client";
import { validateEmail } from "../validation/rules";

const ForgotPassword = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      email: "",
    },

    validate: {
      email: validateEmail,
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
      await publicApi.post("auth/password-reset/request", values);
      openSuccessDialog({
        title: "Link sent",
        message:
          "We have sent a link for resetting your password to your email inbox. Please click the link to reset your password.",
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
          Forgot Password
        </Title>
        <Text mb="md">
          Enter your email address and we will send you a link to reset your
          password.
        </Text>
        <FocusTrap active={true}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              handleSubmit(e);
            })}
          >
            <TextInput
              label="Email"
              placeholder="Email"
              {...form.getInputProps("email")}
              required
              size="md"
            />
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              mt="xl"
              size="md"
            >
              Send
            </Button>
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
