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

const Login = () => {
  let { loginUser, user } = useContext(AuthContext);
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
      password: "",
    },

    validate: {
      // username: (val) =>
      //   val?.length > 15 || val?.length < 3
      //     ? "Name must be 3-15 characters long"
      //     : null,
      username: (val) =>
        val?.length > 15 || val?.length < 3 || !/^[a-zA-Z0-9]+$/.test(val)
          ? "Username must be 3-15 characters and contain only letters and numbers"
          : null,
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
        <FocusTrap active={true}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              loginUser(e, setIsLoading, setErrorData);
            })}
          >
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
              Sign in
            </Button>
            <Group justify="space-between" mt="lg">
              <Anchor
                onClick={() => navigate("/register", { replace: true })}
                component="button"
                size="sm"
              >
                Don't have an account?
              </Anchor>
            </Group>
          </form>
        </FocusTrap>
      </Paper>
    </Container>
  );
};

export default Login;
