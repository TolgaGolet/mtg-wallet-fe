import {
  Card,
  SimpleGrid,
  Text,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { Link } from "react-router-dom";
import {
  IconCreditCard,
  IconList,
  IconListDetails,
  IconPlus,
  IconRepeat,
} from "@tabler/icons-react";
import classes from "./Home.module.css";

/** Every shortcut is a link except Create Transaction (no `to`). */
const SHORTCUTS = [
  { title: "Accounts", icon: IconCreditCard, color: "violet", to: "/accounts" },
  { title: "Payees", icon: IconList, color: "indigo", to: "/payees" },
  {
    title: "Create Transaction",
    icon: IconPlus,
    color: "green",
  },
  {
    title: "Categories",
    icon: IconListDetails,
    color: "blue",
    to: "/categories",
  },
  {
    title: "Transactions",
    icon: IconRepeat,
    color: "teal",
    to: "/transactions",
  },
];

/**
 * Home's shortcut tiles: links to the main pages, plus "Create Transaction".
 * @param {{ onCreateTransaction: () => void, createDisabled?: boolean }} props
 */
export default function ShortcutGrid({ onCreateTransaction, createDisabled }) {
  const theme = useMantineTheme();
  return (
    <Card withBorder radius="md" mt="md">
      <Text style={{ fontWeight: 500 }}>Shortcuts</Text>
      <SimpleGrid cols={{ base: 3, sm: 5 }} mt="md">
        {SHORTCUTS.map((item) => {
          const isCreate = !item.to;
          const disabled = isCreate && createDisabled;
          // Navigation shortcuts are real links; Create Transaction is a button
          const actionProps = isCreate
            ? {
                onClick: onCreateTransaction,
                disabled,
                style: {
                  border: `1px solid ${theme.colors.green[6]}`,
                  ...(disabled ? { opacity: 0.5 } : {}),
                },
              }
            : { component: Link, to: item.to };
          return (
            <UnstyledButton
              key={item.title}
              className={classes.shortcutItem}
              {...actionProps}
            >
              <item.icon
                color={theme.colors[item.color][6]}
                size="2rem"
                aria-hidden
              />
              <Text size="xs" mt={7} ta="center">
                {item.title}
              </Text>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Card>
  );
}
