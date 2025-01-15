import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
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
import { hasLength, useForm } from "@mantine/form";
import { IconCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import showNotification from "../components/showNotification";

const ResetPassword = () => {
  let { user } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      password: "",
    },

    validate: {
      password: hasLength(
        { min: 3, max: 30 },
        "Password must be 3-30 characters long"
      ),
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
        `${process.env.REACT_APP_API_BASE_URL}auth/password-reset/reset/${token}`,
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
          title: "Password reset successful",
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
                Your password has been reset successfully. You can now login.
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
