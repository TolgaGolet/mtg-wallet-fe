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
} from "@mantine/core";
import { useForm, hasLength } from "@mantine/form";

const LoginPage = () => {
  let { loginUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      username: "",
      password: "",
    },

    validate: {
      // username: (val) =>
      //   val.length > 15 || val.length < 3
      //     ? "Name must be 3-15 characters long"
      //     : null,
      username: hasLength(
        { min: 3, max: 15 },
        "Name must be 3-15 characters long"
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
        <FocusTrap active={true}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              loginUser(e, setIsLoading);
            })}
          >
            <TextInput
              label="Username"
              placeholder="Username"
              {...form.getInputProps("username")}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              {...form.getInputProps("password")}
              required
              mt="md"
            />
            <Group justify="space-between" mt="lg">
              <Anchor component="button" size="sm">
                Forgot password?
              </Anchor>
            </Group>
            <Button type="submit" loading={isLoading} fullWidth mt="xl">
              Sign in
            </Button>
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default LoginPage;
