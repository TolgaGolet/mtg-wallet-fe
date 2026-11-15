import { useContext, useState } from "react";
import {
  ActionIcon,
  Group,
  Loader,
  Paper,
  rem,
  Select,
  Skeleton,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import AuthContext from "../../context/AuthContext";
import useAxios from "../../utils/useAxios";
import useApiQuery from "../../utils/useApiQuery";
import { Currency } from "../../enum/Currency";
import { Interval } from "../../enum/Interval";
import AmountFormatter from "../../components/AmountFormatter";
import LoadError from "../../components/LoadError";
import classes from "./Home.module.css";
import { saveHomeCurrency, useHomeCurrencySave } from "./homeCurrencySave";

const INTERVAL_OPTIONS = [
  { value: Interval.DAILY, label: "Daily" },
  { value: Interval.WEEKLY, label: "Weekly" },
  { value: Interval.MONTHLY, label: "Monthly" },
  { value: Interval.YEARLY, label: "Yearly" },
];

function DiffIcon({ profitLoss }) {
  if (profitLoss === 0) {
    return null;
  }
  return profitLoss > 0 ? (
    <IconArrowUpRight size="1rem" stroke={1.5} aria-hidden />
  ) : (
    <IconArrowDownRight size="1rem" stroke={1.5} aria-hidden />
  );
}

function IntervalPicker({ value, onChange }) {
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
        const isSelected = value === option.value;
        return (
          <UnstyledButton
            key={option.value}
            className={`${classes.intervalButton} ${
              isSelected ? classes.selectedInterval : ""
            }`}
            onClick={() => onChange(option.value)}
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
}

/**
 * The net value and profit/loss for the chosen currency and interval. Owns the currency choice
 * (saved on the account in the background, see homeCurrencySave) and the hide-balances toggle.
 * Changing `reloadKey` refetches the net value (e.g. after a transaction was saved).
 */
export default function NetValueCard({ reloadKey }) {
  const { user } = useContext(AuthContext);
  const callApi = useAxios();
  // Remembered per browser, so hidden balances stay hidden on the next visit
  const [hideBalances, setHideBalances] = useLocalStorage({
    key: "mtgWallet.hideBalances",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  // Picked on this visit; null until the user picks one
  const [pickedCurrency, setPickedCurrency] = useState(null);
  // A pick from an earlier visit that is still being saved (the loaded enums may predate it)
  const { pendingCurrency, saving: isSavingCurrency } = useHomeCurrencySave();
  const [selectedInterval, setSelectedInterval] = useState(Interval.DAILY);

  const currenciesQuery = useApiQuery((signal) =>
    callApi.get("home/enums", { signal }).then((response) => response.data)
  );
  const currencies = currenciesQuery.data?.currencies ?? [];
  // Then the account's saved currency (always one of the offered ones), else the first offered
  const selectedCurrency =
    pickedCurrency ??
    pendingCurrency ??
    currenciesQuery.data?.selectedCurrency?.value ??
    currencies[0]?.value ??
    null;
  const currencySymbol = Currency[selectedCurrency]?.symbol;
  // Switching currency or interval aborts the previous request, so a slow response for an old
  // selection can't overwrite the current one. Waits until a currency is known.
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
    [selectedCurrency, selectedInterval, reloadKey],
    { enabled: Boolean(selectedCurrency) }
  );
  const netValueData = netValueQuery.data;

  const retry = () => {
    if (currenciesQuery.error) {
      currenciesQuery.retry();
    }
    netValueQuery.retry();
  };

  if (netValueQuery.error || currenciesQuery.error) {
    return (
      <LoadError mt="md" title="Couldn't load your net value" onRetry={retry} />
    );
  }

  const renderValues = () => {
    if (netValueQuery.loading || currenciesQuery.loading) {
      return <Skeleton height={40} mt={-15} />;
    }
    if (!netValueData) {
      return (
        <Text size="sm" c="dimmed">
          Add an account to see your net value.
        </Text>
      );
    }
    const profitLoss = netValueData.profitLoss;
    return (
      <>
        <Text fz={25} fw={700} lh={1}>
          {hideBalances ? (
            "******"
          ) : (
            <AmountFormatter
              prefix={currencySymbol}
              value={netValueData.netValue}
            />
          )}
        </Text>
        <Text
          c={profitLoss === 0 ? "dimmed" : profitLoss > 0 ? "teal" : "red"}
          fz={13}
          fw={500}
          className={classes.diff}
        >
          <span>
            {hideBalances ? (
              "*** (**%)"
            ) : (
              <>
                <AmountFormatter prefix={currencySymbol} value={profitLoss} />
                {" (" + netValueData.profitLossPercentage + "%)"}
              </>
            )}
          </span>
          <DiffIcon profitLoss={profitLoss} />
        </Text>
      </>
    );
  };

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
          {/* A fixed name with aria-pressed, so the state is announced once */}
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => setHideBalances(!hideBalances)}
            aria-label="Hide balances"
            aria-pressed={hideBalances}
          >
            {hideBalances ? (
              <IconEyeOff size="1.2rem" stroke={1.5} />
            ) : (
              <IconEye size="1.2rem" stroke={1.5} />
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
          // Shown at once, saved in the background; the Select stays usable (see homeCurrencySave)
          onChange={(value) => {
            setPickedCurrency(value);
            void saveHomeCurrency(callApi, user?.sub, value);
          }}
          rightSection={
            isSavingCurrency ? <Loader size={12} aria-hidden /> : undefined
          }
          style={{ width: 90 }}
        />
        <VisuallyHidden role="status">
          {isSavingCurrency && "Saving currency"}
        </VisuallyHidden>
      </Group>

      <Group align="flex-end" gap="xs" mt={25}>
        {renderValues()}
      </Group>
      <IntervalPicker value={selectedInterval} onChange={setSelectedInterval} />
    </Paper>
  );
}
