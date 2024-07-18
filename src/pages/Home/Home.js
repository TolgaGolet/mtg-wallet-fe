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

export default function Home() {
  let { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const callApi = useAxios();
  const theme = useMantineTheme();
  let diff = 0;
  let diffPercent = 0;
  let [isLoading, setIsLoading] = useState(true);
  let [isVisible, setIsVisible] = useState(true);
  let [currencies, setCurrencies] = useState([]);
  let [selectedCurrency, setSelectedCurrency] = useState("TRY");
  let [currencySymbol, setCurrencySymbol] = useState(Currency.TRY.symbol);
  let [selectedInterval, setSelectedInterval] = useState(Interval.DAILY);

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
    {
      title: "Create Transaction",
      icon: IconPlus,
      color: "green",
      style: { border: `1px solid ${theme.colors.green[6]}` },
      onClick: () => {},
    },
    // { title: "Receipts", icon: IconReceipt, color: "green", style: {}, onClick: () => {} },
    // { title: "Taxes", icon: IconReceiptTax, color: "pink", style: {}, onClick: () => {} },
    // { title: "Payments", icon: IconCoin, color: "red", style: {}, onClick: () => {} },
    // { title: "Cashback", icon: IconCashBanknote, color: "orange", style: {}, onClick: () => {} },
  ];

  useEffect(() => {
    callApi.get("account/create/enums").then((response) => {
      setCurrencies(response.data?.currencies);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrencySymbol(Currency[selectedCurrency]?.symbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const renderDiffIcon = () => {
    return diffPercent > 0 ? (
      <IconArrowUpRight size="1rem" stroke={1.5} />
    ) : (
      <IconArrowDownRight size="1rem" stroke={1.5} />
    );
  };

  const renderIntervals = () => {
    return (
      <Group c="dimmed" mt="md" ml={rem(2)} gap={rem(30)}>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.DAILY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.DAILY)}
        >
          D
        </UnstyledButton>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.WEEKLY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.WEEKLY)}
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
        >
          M
        </UnstyledButton>
        <UnstyledButton
          className={`${classes.intervalButton} ${
            selectedInterval === Interval.YEARLY ? classes.selectedInterval : ""
          }`}
          onClick={() => setSelectedInterval(Interval.YEARLY)}
        >
          Y
        </UnstyledButton>
      </Group>
    );
  };

  const renderNetValuePaperSkeleton = () => {
    return <Skeleton height={150} mt={10} />;
  };

  const renderNetValuePaper = () => {
    return (
      <Paper
        withBorder
        p="md"
        radius="md"
        mt="md"
        className={classes.netValuePaper}
      >
        <Group justify="space-between">
          <Group>
            <Text size="md" c="dimmed" className={classes.title}>
              Net Value
            </Text>
            {isVisible ? (
              <IconEye
                size="1.3rem"
                stroke={1.5}
                onClick={() => setIsVisible(false)}
              />
            ) : (
              <IconEyeOff
                size="1rem"
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
            size="md"
            disabled={isLoading}
            value={selectedCurrency}
            onChange={(value) => setSelectedCurrency(value)}
            style={{ width: 90 }}
          />
        </Group>

        <Group align="flex-end" gap="xs" mt={25}>
          <Text fz={30} fw={700} lh={1}>
            {isVisible ? currencySymbol + "0.00" : "******"}
          </Text>
          <Text
            c={diffPercent > 0 ? "teal" : "red"}
            fw={500}
            className={classes.diff}
          >
            {isVisible ? (
              <>
                <span>{currencySymbol + diff + " (" + diffPercent + "%)"}</span>
                {renderDiffIcon()}
              </>
            ) : (
              <>
                <span>{"*** (**%)"}</span>
                {renderDiffIcon()}
              </>
            )}
          </Text>
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

  return (
    <>
      <Text fw={500}>Hello {user?.sub} 👋</Text>
      {isLoading ? renderNetValuePaperSkeleton() : renderNetValuePaper()}
      {renderShortcuts()}
      <Title order={3} mb="md" mt="md">
        Recent Transactions
      </Title>
    </>
  );
}
