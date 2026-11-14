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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import PasswordStrength from "../components/PasswordStrength";
import {
  validatePassword,
  validateEmail,
  validatePersonName,
  validateSurname,
  validateUsername,
} from "../validation/rules";
import { IconX } from "@tabler/icons-react";
import openSuccessDialog from "../components/openSuccessDialog";
import { getErrorMessage } from "../api/client";

const SignUp = () => {
  const { signUpUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({
    isErrorState: false,
    message: "",
  });
  const form = useForm({
    validateInputOnChange: true,
    initialValues: {
      username: "",
      email: "",
      name: "",
      surname: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      username: validateUsername,
      email: validateEmail,
      name: validatePersonName,
      surname: validateSurname,
      password: validatePassword,
      confirmPassword: (val, { password }) => {
        if (val !== password) {
          return "Passwords do not match";
        }
        return null;
      },
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await signUpUser(values);
      setErrorData({ isErrorState: false, message: "" });
      openSuccessDialog({
        title: "Registration successful",
        message:
          "We have sent an email verification link to your email inbox. Please click the link to verify your email address. Then you will be able to login.",
        onOk: () => navigate("/", { replace: true }),
      });
    } catch (error) {
      // The client has shown the toast; also keep the server's message (e.g. a taken username) on the form
      const message = getErrorMessage(error, "");
      if (message) {
        setErrorData({ isErrorState: true, message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {errorData.isErrorState ? (
          <Alert variant="light" color="red" title="Error" icon={<IconX />}>
            {errorData.message}
          </Alert>
        ) : null}
        <FocusTrap active={false}>
          <form onSubmit={form.onSubmit(onSubmit)}>
            <TextInput
              label="Username"
              placeholder="Username"
              {...form.getInputProps("username")}
              required
              size="md"
            />
            <TextInput
              label="Email"
              placeholder="Email"
              {...form.getInputProps("email")}
              required
              size="md"
            />
            <TextInput
              label="Name"
              placeholder="Name"
              {...form.getInputProps("name")}
              required
              size="md"
            />
            <TextInput
              label="Surname"
              placeholder="Surname"
              {...form.getInputProps("surname")}
              size="md"
            />
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
              Sign up
            </Button>
            <Group justify="space-between" mt="lg">
              <Anchor component={Link} to="/login" replace size="sm">
                Already have an account?
              </Anchor>
            </Group>
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default SignUp;
