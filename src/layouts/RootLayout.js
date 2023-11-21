import { NavLink, Outlet } from "react-router-dom";
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
import Header from "../components/Header";
import classes from "./RootLayout.module.css";
import { IconSun, IconMoon } from "@tabler/icons-react";
import cx from "clsx";

export default function RootLayout() {
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
              <Group ml="xl" gap={0} visibleFrom="sm">
                <NavLink to="/" className={classes.control}>
                  <UnstyledButton>Home</UnstyledButton>
                </NavLink>
                <NavLink to="/careers" className={classes.control}>
                  <UnstyledButton>Careers</UnstyledButton>
                </NavLink>
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
              </Group>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar py="md" px={4}>
          <NavLink to="/" className={classes.control}>
            <UnstyledButton onClick={toggle}>Home</UnstyledButton>
          </NavLink>
          <NavLink to="/careers" className={classes.control}>
            <UnstyledButton onClick={toggle}>Careers</UnstyledButton>
          </NavLink>
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
            mt="md"
          >
            Toggle Dark / Light Mode
          </Button>
        </AppShell.Navbar>

        <AppShell.Main>
          <Header />
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </div>
  );
}
