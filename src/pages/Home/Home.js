import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/AuthContext";
import {
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
} from "@mantine/core";
import classes from "./Home.module.css";
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
import useAxios from "../../utils/useAxios";
import { Currency } from "../../enum/Currency";
import { Interval } from "../../enum/Interval";
import { useNavigate } from "react-router-dom";
import AmountFormatter from "../../components/AmountFormatter";
import TransactionModal from "./TransactionModal";
import TransactionRow from "../../components/TransactionRow";

export default function Home() {
  let { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const callApi = useAxios();
  const theme = useMantineTheme();
  let [isLoading, setIsLoading] = useState(true);
  let [isRecentTransactionsLoading, setIsRecentTransactionsLoading] =
    useState(true);
  let [recentTransactions, setRecentTransactions] = useState(null);
  let [isVisible, setIsVisible] = useState(true);
  let [currencies, setCurrencies] = useState([]);
  let [selectedCurrency, setSelectedCurrency] = useState("TRY");
  let [currencySymbol, setCurrencySymbol] = useState(Currency.TRY.symbol);
  let [selectedInterval, setSelectedInterval] = useState(Interval.DAILY);
  let [netValueData, setNetValueData] = useState({
    netValue: 0.0,
    profitLoss: 0.0,
    profitLossPercentage: 0.0,
  });
  let [isTransactionModelOpened, setIsTransactionModelOpened] = useState(false);
  let [displayedTransactionId, setDisplayedTransactionId] = useState(null);

  const shortcutItems = [
    {
      title: "Accounts",
      icon: IconCreditCard,
      color: "violet",
      style: {},
      onClick: () => {
        navigate(`/accounts/`, { replace: false });
      },
    },
    {
      title: "Payees",
      icon: IconList,
      color: "indigo",
      style: {},
      onClick: () => {
        navigate(`/payees/`, { replace: false });
      },
    },
    {
      title: "Create Transaction",
      icon: IconPlus,
      color: "green",
      style: { border: `1px solid ${theme.colors.green[6]}` },
      onClick: () => {
        setDisplayedTransactionId(null);
        setIsTransactionModelOpened(true);
      },
    },
    {
      title: "Categories",
      icon: IconListDetails,
      color: "blue",
      style: {},
      onClick: () => {
        navigate(`/categories/`, { replace: false });
      },
    },
    {
      title: "Statistics (Soon)",
      icon: IconReport,
      color: "cyan",
      style: { color: theme.colors.gray[7] },
      onClick: () => {},
    },
    {
      title: "Transactions (Soon)",
      icon: IconRepeat,
      color: "teal",
      style: { color: theme.colors.gray[7] },
      onClick: () => {},
    },
    // { title: "Receipts", icon: IconReceipt, color: "green", style: {}, onClick: () => {} },
    // { title: "Taxes", icon: IconReceiptTax, color: "pink", style: {}, onClick: () => {} },
    // { title: "Payments", icon: IconCoin, color: "red", style: {}, onClick: () => {} },
    // { title: "Cashback", icon: IconCashBanknote, color: "orange", style: {}, onClick: () => {} },
  ];

  const getNetValueData = () => {
    callApi
      .get("home/net-value", {
        params: {
          currencyValue: selectedCurrency,
          intervalValue: selectedInterval,
        },
      })
      .then((response) => {
        setNetValueData(response.data);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    callApi.get("home/enums").then((response) => {
      setCurrencies(response.data?.currencies);
      getNetValueData();
      callApi
        .post("transaction/search", {}, { params: { pageNo: 0 } })
        .then((response) => {
          setRecentTransactions(response.data?.content);
          setIsRecentTransactionsLoading(false);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setCurrencySymbol(Currency[selectedCurrency]?.symbol);
    getNetValueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  useEffect(() => {
    setIsLoading(true);
    getNetValueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInterval]);

  const renderDiffIcon = () => {
    return netValueData?.profitLoss > 0 ? (
      <IconArrowUpRight size="1rem" stroke={1.5} />
    ) : netValueData?.profitLoss === 0 ? null : (
      <IconArrowDownRight size="1rem" stroke={1.5} />
    );
  };

  const renderIntervals = () => {
    return (
      <Group c="dimmed" mt="md" ml={rem(2)} gap={rem(30)} p={rem(5)}>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.DAILY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.DAILY)}
          disabled={isLoading}
        >
          D
        </UnstyledButton>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.WEEKLY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.WEEKLY)}
          disabled={isLoading}
        >
          W
        </UnstyledButton>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.MONTHLY
              ? classes.selectedInterval
              : ""
          }`}
          onClick={() => setSelectedInterval(Interval.MONTHLY)}
          disabled={isLoading}
        >
          M
        </UnstyledButton>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.YEARLY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.YEARLY)}
          disabled={isLoading}
        >
          Y
        </UnstyledButton>
      </Group>
    );
  };

  const renderNetValueSkeleton = () => {
    return <Skeleton height={40} mt={-15} />;
  };

  const renderNetValuePaper = () => {
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
            {isVisible ? (
              <IconEye
                size="1.2rem"
                stroke={1.5}
                onClick={() => setIsVisible(false)}
              />
            ) : (
              <IconEyeOff
                size="1.2rem"
                stroke={1.5}
                onClick={() => setIsVisible(true)}
              />
            )}
          </Group>
          <Select
            data={currencies.map((currency) => ({
              value: currency.value,
              label: currency.value,
            }))}
            allowDeselect={false}
            size="xs"
            disabled={isLoading}
            value={selectedCurrency}
            onChange={(value) => setSelectedCurrency(value)}
            style={{ width: 90 }}
          />
        </Group>

        <Group align="flex-end" gap="xs" mt={25}>
          {isLoading ? (
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
    return shortcutItems.map((item) => (
      <UnstyledButton
        key={item.title}
        className={classes.shortcutItem}
        style={item.style}
        onClick={item.onClick}
      >
        <item.icon color={theme.colors[item.color][6]} size="2rem" />
        <Text size="xs" mt={7} ta="center">
          {item.title}
        </Text>
      </UnstyledButton>
    ));
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

  const renderSkeletonRecentTransactions = () => {
    return (
      <>
        <Skeleton height={100} mt={10} />
        <Skeleton height={100} mt={10} />
        <Skeleton height={100} mt={10} />
        <Skeleton height={100} mt={10} />
        <Skeleton height={100} mt={10} />
        <Skeleton height={100} mt={10} />
      </>
    );
  };

  const onClickTransactionRow = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModelOpened(true);
  };

  const renderRecentTransactions = () => {
    if (!recentTransactions || recentTransactions.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          No recent transactions
        </Text>
      );
    }
    return recentTransactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        payee={transaction.payee?.name}
        category={transaction.payee?.category?.name}
        parentCategory={transaction.payee?.category?.parentCategory?.name}
        typeValue={transaction.type?.value}
        amount={transaction.amount}
        currencyValue={transaction.sourceAccount?.currency?.value}
        dateTime={transaction.dateTime}
        sourceAccount={transaction.sourceAccount?.name}
        targetAccount={transaction.targetAccount?.name}
        onClick={() => onClickTransactionRow(transaction.id)}
      ></TransactionRow>
    ));
  };

  return (
    <>
      <Text fw={500}>Hello {user?.sub} 👋</Text>
      {renderNetValuePaper()}
      {renderShortcuts()}
      <Group justify="space-between" mb="md" mt="md">
        <Title order={3}>Recent Transactions</Title>
        <Text size="sm" c="dimmed">
          See All -&gt;
        </Text>
      </Group>
      {isRecentTransactionsLoading
        ? renderSkeletonRecentTransactions()
        : renderRecentTransactions()}
      <TransactionModal
        opened={isTransactionModelOpened}
        close={() => setIsTransactionModelOpened(false)}
        loadedRecentTransactions={recentTransactions}
        transactionId={displayedTransactionId}
      ></TransactionModal>
    </>
  );
}
