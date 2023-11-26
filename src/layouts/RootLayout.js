import { Outlet, useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import {
  AppShell,
  Burger,
  Group,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useComputedColorScheme,
  ActionIcon,
  Button,
} from "@mantine/core";
import classes from "./RootLayout.module.css";
import { IconSun, IconMoon, IconLogout } from "@tabler/icons-react";
import cx from "clsx";
import AuthContext from "../context/AuthContext";
import React, { useContext } from "react";

export default function RootLayout() {
  const navigate = useNavigate();
  let { logoutUser, user } = useContext(AuthContext);
  const [opened, { toggle }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <div className="root-layout">
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { desktop: true, mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group justify="space-between" style={{ flex: 1 }}>
              <Title order={1} className={classes.title}>
                MTG Wallet
              </Title>
              <Group ml="xl" gap={20} visibleFrom="sm">
                <UnstyledButton
                  onClick={() => navigate("/", { replace: false })}
                  className={classes.control}
                >
                  Home
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => navigate("/careers", { replace: false })}
                  className={classes.control}
                >
                  Careers
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => navigate("/helpContact", { replace: false })}
                  className={classes.control}
                >
                  Help & Contact
                </UnstyledButton>
                <ActionIcon
                  onClick={() =>
                    setColorScheme(
                      computedColorScheme === "light" ? "dark" : "light"
                    )
                  }
                  variant="default"
                  size="xl"
                  aria-label="Toggle color scheme"
                >
                  {computedColorScheme === "light" ? (
                    <IconMoon
                      className={cx(classes.icon, classes.dark)}
                      stroke={1.5}
                    />
                  ) : (
                    <IconSun
                      className={cx(classes.icon, classes.light)}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
                {user ? (
                  <ActionIcon
                    onClick={() => {
                      logoutUser();
                    }}
                    variant="default"
                    size="xl"
                    aria-label="Logout"
                  >
                    <IconLogout
                      className={cx(classes.icon, classes.light)}
                      stroke={1.5}
                    />
                  </ActionIcon>
                ) : null}
              </Group>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar py="md" px={4}>
          <UnstyledButton
            onClick={() => {
              navigate("/", { replace: false });
              toggle();
            }}
            className={classes.control}
            mb="md"
            ml="md"
          >
            Home
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              navigate("/careers", { replace: false });
              toggle();
            }}
            className={classes.control}
            mb="md"
            ml="md"
          >
            Careers
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              navigate("/helpContact", { replace: false });
              toggle();
            }}
            className={classes.control}
            mb="md"
            ml="md"
          >
            Help & Contact
          </UnstyledButton>
          <Button
            onClick={() =>
              setColorScheme(computedColorScheme === "light" ? "dark" : "light")
            }
            justify="center"
            fullWidth
            leftSection={
              computedColorScheme === "light" ? (
                <IconMoon
                  className={cx(classes.icon, classes.dark)}
                  stroke={1.5}
                />
              ) : (
                <IconSun
                  className={cx(classes.icon, classes.light)}
                  stroke={1.5}
                />
              )
            }
            variant="default"
            mt="xs"
          >
            Toggle Dark / Light Mode
          </Button>
          {user ? (
            <Button
              onClick={() => {
                logoutUser();
                toggle();
              }}
              justify="center"
              fullWidth
              leftSection={
                <IconLogout
                  className={cx(classes.icon, classes.light)}
                  stroke={1.5}
                />
              }
              variant="default"
              mt="md"
            >
              Logout
            </Button>
          ) : null}
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </div>
  );
}
