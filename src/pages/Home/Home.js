import React, { useContext, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Card,
  Group,
  Paper,
  rem,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
  UnstyledButton,
  useMantineTheme,
  Container,
  Stack,
  Divider,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@mantine/hooks";
import AuthContext from "../../context/AuthContext";
import useAxios from "../../utils/useAxios";
import useApiQuery from "../../utils/useApiQuery";
import { Currency } from "../../enum/Currency";
import { Interval } from "../../enum/Interval";
import AmountFormatter from "../../components/AmountFormatter";
import TransactionModal from "../../components/TransactionModal/TransactionModal";
import TransactionRow from "../../components/TransactionRow";
import LoadError from "../../components/LoadError";
import ListSkeleton from "../../components/ListSkeleton";
import { getDateGroup } from "../../utils/dates";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCreditCard,
  IconEye,
  IconEyeOff,
  IconList,
  IconListDetails,
  IconPlus,
  IconRepeat,
  IconReport,
} from "@tabler/icons-react";
import classes from "./Home.module.css";

const INTERVAL_OPTIONS = [
  { value: Interval.DAILY, label: "Daily" },
  { value: Interval.WEEKLY, label: "Weekly" },
  { value: Interval.MONTHLY, label: "Monthly" },
  { value: Interval.YEARLY, label: "Yearly" },
];

const GROUP_ORDER = ["Today", "Yesterday", "Last Week", "Last Month", "Older"];

export default function Home() {
  const { user } = useContext(AuthContext);
  const callApi = useAxios();
  const theme = useMantineTheme();
  // Remembered per browser, so hidden balances stay hidden on the next visit
  const [hideBalances, setHideBalances] = useLocalStorage({
    key: "mtgWallet.hideBalances",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const isVisible = !hideBalances;
  const [selectedCurrency, setSelectedCurrency] = useState("TRY");
  const [selectedInterval, setSelectedInterval] = useState(Interval.DAILY);
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);
  const currencySymbol = Currency[selectedCurrency]?.symbol;

  // Independent loads, so one failing doesn't block the others
  const currenciesQuery = useApiQuery((signal) =>
    callApi
      .get("home/enums", { signal })
      .then((response) => response.data?.currencies ?? [])
  );
  const recentTransactionsQuery = useApiQuery((signal) =>
    callApi
      .post("transaction/search", {}, { params: { pageNo: 0 }, signal })
      .then((response) => response.data?.content ?? [])
  );
  // Switching currency or interval aborts the previous request, so a slow response for an old
  // selection can't overwrite the current one
  const netValueQuery = useApiQuery(
    (signal) =>
      callApi
        .get("home/net-value", {
          params: {
            currencyValue: selectedCurrency,
            intervalValue: selectedInterval,
          },
          signal,
        })
        .then((response) => response.data),
    [selectedCurrency, selectedInterval]
  );

  const currencies = currenciesQuery.data ?? [];
  const recentTransactions = recentTransactionsQuery.data ?? null;
  const netValueData = netValueQuery.data;
  const isNetValueLoading = netValueQuery.loading;

  const retryNetValueCard = () => {
    if (currenciesQuery.error) {
      currenciesQuery.retry();
    }
    netValueQuery.retry();
  };

  // After a save in the modal, refresh only what Home shows
  const onTransactionSaved = () => {
    recentTransactionsQuery.retry();
    netValueQuery.retry();
  };

  const shortcutItems = [
    {
      title: "Accounts",
      icon: IconCreditCard,
      color: "violet",
      to: "/accounts",
    },
    {
      title: "Payees",
      icon: IconList,
      color: "indigo",
      to: "/payees",
    },
    {
      title: "Create Transaction",
      icon: IconPlus,
      color: "green",
      style: { border: `1px solid ${theme.colors.green[6]}` },
      // The modal reuses Home's recent transactions, so wait until they are loaded
      disabled: recentTransactionsQuery.loading,
      onClick: () => {
        setDisplayedTransactionId(null);
        setIsTransactionModalOpened(true);
      },
    },
    {
      title: "Categories",
      icon: IconListDetails,
      color: "blue",
      to: "/categories",
    },
    {
      title: "Statistics (Soon)",
      icon: IconReport,
      color: "cyan",
      style: { color: theme.colors.gray[7] },
      disabled: true,
    },
    {
      title: "Transactions",
      icon: IconRepeat,
      color: "teal",
      to: "/transactions",
    },
  ];

  const renderDiffIcon = () => {
    return netValueData?.profitLoss > 0 ? (
      <IconArrowUpRight size="1rem" stroke={1.5} aria-hidden />
    ) : netValueData?.profitLoss === 0 ? null : (
      <IconArrowDownRight size="1rem" stroke={1.5} aria-hidden />
    );
  };

  const renderIntervals = () => {
    return (
      <Group
        c="dimmed"
        mt="md"
        ml={rem(2)}
        gap={rem(30)}
        p={rem(5)}
        role="group"
        aria-label="Interval"
      >
        {INTERVAL_OPTIONS.map((option) => {
          const isSelected = selectedInterval === option.value;
          return (
            <UnstyledButton
              key={option.value}
              className={`${classes.intervalButton} ${
                isSelected ? classes.selectedInterval : ""
              }`}
              onClick={() => setSelectedInterval(option.value)}
              aria-pressed={isSelected}
              aria-label={option.label}
              title={option.label}
            >
              {option.value}
            </UnstyledButton>
          );
        })}
      </Group>
    );
  };

  const renderNetValueSkeleton = () => {
    return <Skeleton height={40} mt={-15} />;
  };

  const renderNetValuePaper = () => {
    if (netValueQuery.error || currenciesQuery.error) {
      return (
        <LoadError
          mt="md"
          title="Couldn't load your net value"
          onRetry={retryNetValueCard}
        />
      );
    }
    return (
      <Paper
        withBorder
        p="md"
        pb="sm"
        radius="md"
        mt="md"
        className={classes.netValuePaper}
      >
        <Group justify="space-between">
          <Group>
            <Text size="sm" c="dimmed" className={classes.title}>
              Net Value
            </Text>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setHideBalances(isVisible)}
              aria-label={isVisible ? "Hide balances" : "Show balances"}
              aria-pressed={!isVisible}
            >
              {isVisible ? (
                <IconEye size="1.2rem" stroke={1.5} />
              ) : (
                <IconEyeOff size="1.2rem" stroke={1.5} />
              )}
            </ActionIcon>
          </Group>
          <Select
            aria-label="Currency"
            data={currencies.map((currency) => ({
              value: currency.value,
              label: currency.value,
            }))}
            allowDeselect={false}
            size="xs"
            disabled={currenciesQuery.loading}
            value={selectedCurrency}
            onChange={(value) => setSelectedCurrency(value)}
            style={{ width: 90 }}
          />
        </Group>

        <Group align="flex-end" gap="xs" mt={25}>
          {isNetValueLoading || !netValueData ? (
            renderNetValueSkeleton()
          ) : (
            <>
              <Text fz={25} fw={700} lh={1}>
                {isVisible ? (
                  <AmountFormatter
                    prefix={currencySymbol}
                    value={netValueData?.netValue}
                  ></AmountFormatter>
                ) : (
                  "******"
                )}
              </Text>
              <Text
                c={
                  netValueData?.profitLoss === 0
                    ? "dimmed"
                    : netValueData?.profitLoss > 0
                      ? "teal"
                      : "red"
                }
                fz={13}
                fw={500}
                className={classes.diff}
              >
                {isVisible ? (
                  <>
                    <span>
                      <AmountFormatter
                        prefix={currencySymbol}
                        value={netValueData?.profitLoss}
                      ></AmountFormatter>
                      {" (" + netValueData?.profitLossPercentage + "%)"}
                    </span>
                    {renderDiffIcon()}
                  </>
                ) : (
                  <>
                    <span>{"*** (**%)"}</span>
                    {renderDiffIcon()}
                  </>
                )}
              </Text>
            </>
          )}
        </Group>
        {renderIntervals()}
      </Paper>
    );
  };

  const renderShortcutItems = () => {
    return shortcutItems.map((item) => {
      // Navigation shortcuts are real links; the rest are buttons
      const linkProps = item.to ? { component: Link, to: item.to } : {};
      return (
        <UnstyledButton
          key={item.title}
          className={classes.shortcutItem}
          style={item.disabled ? { ...item.style, opacity: 0.5 } : item.style}
          onClick={item.onClick}
          disabled={item.disabled}
          {...linkProps}
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
    });
  };

  const renderShortcuts = () => {
    return (
      <Card withBorder radius="md" mt="md">
        <Text style={{ fontWeight: 500 }}>Shortcuts</Text>
        <SimpleGrid cols={3} mt="md">
          {renderShortcutItems()}
        </SimpleGrid>
      </Card>
    );
  };

  const onClickTransactionRow = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModalOpened(true);
  };

  const renderRecentTransactions = () => {
    if (!recentTransactions || recentTransactions.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          No recent transactions
        </Text>
      );
    }

    const groupedTransactions = recentTransactions.reduce(
      (groups, transaction) => {
        const group = getDateGroup(transaction.dateTime);
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(transaction);
        return groups;
      },
      {}
    );

    return (
      <Stack>
        {GROUP_ORDER.map((group) => {
          const transactions = groupedTransactions[group];
          if (!transactions || transactions.length === 0) {
            return null;
          }

          const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
          );

          return (
            <React.Fragment key={group}>
              <Divider
                label={
                  <Text fw={250} size="sm">
                    {group}
                  </Text>
                }
                labelPosition="left"
              />
              {sortedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  payee={transaction.payee?.name}
                  category={transaction.payee?.category?.name}
                  parentCategory={
                    transaction.payee?.category?.parentCategoryName
                  }
                  typeValue={transaction.type?.value}
                  amount={transaction.amount}
                  currencyValue={transaction.sourceAccount?.currency?.value}
                  dateTime={transaction.dateTime}
                  sourceAccount={transaction.sourceAccount?.name}
                  targetAccount={transaction.targetAccount?.name}
                  onClick={() => onClickTransactionRow(transaction.id)}
                />
              ))}
            </React.Fragment>
          );
        })}
      </Stack>
    );
  };

  const renderRecentTransactionsSection = () => {
    if (recentTransactionsQuery.loading) {
      return <ListSkeleton />;
    }
    if (recentTransactionsQuery.error) {
      return (
        <LoadError
          title="Couldn't load recent transactions"
          onRetry={recentTransactionsQuery.retry}
        />
      );
    }
    return renderRecentTransactions();
  };

  return (
    <Container size="lg" px={0}>
      <Text fw={500}>Hello {user?.sub} 👋</Text>
      {renderNetValuePaper()}
      {renderShortcuts()}
      <Group justify="space-between" mb="md" mt="md">
        <Title order={3}>Recent Transactions</Title>
        <Anchor
          component={Link}
          to="/transactions"
          size="sm"
          c="dimmed"
          className={classes.seeAllButton}
        >
          See All →
        </Anchor>
      </Group>
      {renderRecentTransactionsSection()}
      <TransactionModal
        opened={isTransactionModalOpened}
        close={() => setIsTransactionModalOpened(false)}
        loadedRecentTransactions={recentTransactions}
        transactionId={displayedTransactionId}
        onSaved={onTransactionSaved}
      ></TransactionModal>
    </Container>
  );
}
