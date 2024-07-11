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
} from "@mantine/core";
import { useForm, hasLength } from "@mantine/form";
import { IconX } from "@tabler/icons-react";

const SignUp = () => {
  let { signUpUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({
    isErrorState: false,
    message: "",
  });
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      name: "",
      surname: "",
      password: "",
    },

    validate: {
      username: (val) =>
        val?.length > 15 || val?.length < 3 || !/^[a-zA-Z0-9]+$/.test(val)
          ? "Username must be 3-15 characters and contain only letters and numbers"
          : null,
      email: (val) =>
        val?.length > 100 ||
        val?.length < 3 ||
        !/^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/.test(val)
          ? "Email must be 3-100 characters and should be valid"
          : null,
      name: hasLength({ min: 3, max: 15 }, "Name must be 3-15 characters long"),
      surname: hasLength(
        { min: 0, max: 15 },
        "Surname must be 0-15 characters long"
      ),
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

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {errorData.isErrorState ? (
          <Alert variant="light" color="red" title="Error" icon={<IconX />}>
            {errorData.message}
          </Alert>
        ) : null}
        <FocusTrap active={false}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              signUpUser(e, setIsLoading, setErrorData);
            })}
          >
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
              <Anchor
                onClick={() => navigate("/login", { replace: true })}
                component="button"
                size="sm"
              >
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
