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
  Progress,
  List,
  ThemeIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCheck, IconX } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import showNotification from "../components/showNotification";

const ResetPassword = () => {
  let { user } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const form = useForm({
    validateInputOnChange: true,
    initialValues: {
      password: "",
      confirmPassword: "",
    },

    validate: {
      password: (val) => {
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
          body: JSON.stringify({ password: e.password }),
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
            <PasswordInput
              label="Confirm password"
              placeholder="Confirm password"
              {...form.getInputProps("confirmPassword")}
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
