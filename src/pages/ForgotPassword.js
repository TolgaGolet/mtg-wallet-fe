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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import showNotification from "../components/showNotification";

const ForgotPassword = () => {
  let { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      email: "",
    },

    validate: {
      email: (val) =>
        val?.length > 100 ||
        val?.length < 3 ||
        !/^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/.test(val)
          ? "Email must be 3-100 characters and should be valid"
          : null,
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
        `${process.env.REACT_APP_API_BASE_URL}auth/password-reset/request`,
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
                We have sent a link for resetting your password to your email
                inbox. Please click the link to reset your password.
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
