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
  Progress,
  Text,
  List,
  ThemeIcon,
} from "@mantine/core";
import { useForm, hasLength } from "@mantine/form";
import { IconX, IconCheck } from "@tabler/icons-react";

const SignUp = () => {
  let { signUpUser, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorData, setErrorData] = useState({
    isErrorState: false,
    message: "",
  });
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
