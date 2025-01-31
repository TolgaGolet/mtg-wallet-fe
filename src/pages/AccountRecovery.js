import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  Paper,
  Container,
  Button,
  FocusTrap,
  Center,
  rem,
  Title,
  Text,
  Group,
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import showNotification from "../components/showNotification";

const AccountRecovery = () => {
  let { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}auth/account-recovery/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(e),
        }
      );
      if (response?.status === 200) {
        setIsLoading(false);
        modals.open({
          title: "Link sent",
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
                We have sent a link for recovering your account to your email
                inbox. Please click the link to recover your account. This
                action will disable your two factor authentication. You should
                enable this feature once you login for your security.
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
        setIsLoading(false);
        showNotification(message, "error");
      }
    } catch (error) {
      setIsLoading(false);
      showNotification("Something went wrong! " + error.toString(), "error");
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
