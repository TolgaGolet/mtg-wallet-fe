import { Link, NavLink, Outlet } from "react-router-dom";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  AppShell,
  Burger,
  Group,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useComputedColorScheme,
  useMantineTheme,
  ActionIcon,
  Button,
} from "@mantine/core";
import classes from "./RootLayout.module.css";
import { IconSun, IconMoon, IconLogout } from "@tabler/icons-react";
import cx from "clsx";
import AuthContext from "../context/AuthContext";
import { Suspense, useContext, useEffect } from "react";
import ListSkeleton from "../components/ListSkeleton";

// One list for the desktop and mobile menus. `private` items need a logged-in user.
const NAV_ITEMS = [
  { label: "Home", to: "/", end: true },
  { label: "Transactions", to: "/transactions", private: true },
  { label: "Accounts", to: "/accounts", private: true },
  { label: "Payees", to: "/payees", private: true },
  { label: "Categories", to: "/categories", private: true },
  { label: "Settings", to: "/settings", private: true },
  { label: "Help & Contact", to: "/help-contact" },
];

export default function RootLayout() {
  const { logoutUser, user } = useContext(AuthContext);
  const [opened, { toggle, close }] = useDisclosure();
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);
  // The burger menu is mobile-only: widening the window closes it, so it can't stay mounted off-screen
  useEffect(() => {
    if (isDesktop) close();
  }, [isDesktop, close]);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const mobileButtonMargin = "lg";
  const navItems = NAV_ITEMS.filter((item) => !item.private || user);
  const toggleColorScheme = () =>
    setColorScheme(computedColorScheme === "light" ? "dark" : "light");

  // NavLink sets aria-current="page" on the active item, which the CSS also uses for styling
  const renderNavItems = (itemProps = {}) =>
    navItems.map((item) => (
      <UnstyledButton
        key={item.to}
        component={NavLink}
        to={item.to}
        end={item.end}
        className={classes.control}
        {...itemProps}
      >
        {item.label}
      </UnstyledButton>
    ));

  const colorSchemeIcon =
    computedColorScheme === "light" ? (
      <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
    ) : (
      <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
    );

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
              aria-label="Toggle navigation"
              aria-expanded={opened}
            />
            <Group justify="space-between" style={{ flex: 1 }}>
              <Link to="/" className={classes.titleLink}>
                <Title order={1} className={classes.title}>
                  MTG Wallet
                </Title>
              </Link>
              <Group ml="xl" gap={20} visibleFrom="sm">
                <Group component="nav" aria-label="Main" gap={20}>
                  {renderNavItems()}
                </Group>
                <ActionIcon
                  onClick={toggleColorScheme}
                  variant="default"
                  size="xl"
                  aria-label="Toggle color scheme"
                >
                  {colorSchemeIcon}
                </ActionIcon>
                {user ? (
                  <ActionIcon
                    onClick={() => logoutUser()}
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

        {/* Only while open: AppShell.Navbar is a <nav>, so a closed one would be an empty landmark and
            its links would still be reachable with Tab while off-screen */}
        {opened && (
          <AppShell.Navbar py="md" px={4} aria-label="Main">
            {renderNavItems({
              onClick: close,
              mb: mobileButtonMargin,
              ml: mobileButtonMargin,
            })}
            <Button
              onClick={toggleColorScheme}
              justify="center"
              fullWidth
              leftSection={colorSchemeIcon}
              variant="default"
              mt="xs"
            >
              Toggle Dark / Light Mode
            </Button>
            {user ? (
              <Button
                onClick={() => {
                  logoutUser();
                  close();
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
        )}

        <AppShell.Main>
          {/* Most pages are lazy-loaded (App.js); show a skeleton while a page's code downloads */}
          <Suspense fallback={<ListSkeleton />}>
            <Outlet />
          </Suspense>
        </AppShell.Main>
      </AppShell>
    </div>
  );
}
