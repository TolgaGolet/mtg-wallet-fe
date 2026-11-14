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
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import openSuccessDialog from "../components/openSuccessDialog";
import { publicApi } from "../api/client";
import { requirePassword, validateUsername } from "../validation/rules";

const AccountRecovery = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      password: "",
    },

    validate: {
      username: validateUsername,
      // The account password: the server decides whether it is right
      password: requirePassword,
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
      await publicApi.post("auth/account-recovery/request", values);
      openSuccessDialog({
        title: "Link sent",
        message:
          "We have sent a link for recovering your account to your email inbox. Please click the link to recover your account. This action will disable your two factor authentication. You should enable this feature once you login for your security.",
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
          Recover Account
        </Title>
        <Text mb="md">
          Enter your credentials and we will send you a link to recover your
          account.
        </Text>
        <FocusTrap active={true}>
          <form onSubmit={form.onSubmit((e) => handleSubmit(e))}>
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

export default AccountRecovery;
