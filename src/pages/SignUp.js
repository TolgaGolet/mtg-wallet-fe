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
import { useForm, hasLength, isEmail } from "@mantine/form";
import { IconX } from "@tabler/icons-react";

const SignUp = () => {
  let { signUpUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUsernameAlreadyTaken, setIsUsernameAlreadyTaken] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      name: "",
      surname: "",
      password: "",
    },

    validate: {
      username: hasLength(
        { min: 3, max: 15 },
        "Username must be 3-15 characters long"
      ),
      email: isEmail("Invalid email address"),
      name: hasLength({ min: 3, max: 15 }, "Name must be 3-15 characters long"),
      surname: hasLength(
        { min: 0, max: 15 },
        "Surname must be 0-15 characters long"
      ),
      password: hasLength(
        { min: 3, max: 15 },
        "Password must be 3-15 characters long"
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
        {isUsernameAlreadyTaken ? (
          <Alert variant="light" color="red" title="Error" icon={<IconX />}>
            Username is already taken. Please choose another username
          </Alert>
        ) : null}
        <FocusTrap active={false}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              signUpUser(e, setIsLoading, setIsUsernameAlreadyTaken);
            })}
          >
            <TextInput
              label="Username"
              placeholder="Username"
              {...form.getInputProps("username")}
              required
            />
            <TextInput
              label="Email"
              placeholder="Email"
              {...form.getInputProps("email")}
              required
            />
            <TextInput
              label="Name"
              placeholder="Name"
              {...form.getInputProps("name")}
              required
            />
            <TextInput
              label="Surname"
              placeholder="Surname"
              {...form.getInputProps("surname")}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              {...form.getInputProps("password")}
              required
              mt="md"
            />
            <Button type="submit" loading={isLoading} fullWidth mt="xl">
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
