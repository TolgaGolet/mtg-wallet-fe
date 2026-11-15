import {
  Button,
  Container,
  Group,
  TextInput,
  Text,
  Select,
} from "@mantine/core";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconSearch } from "@tabler/icons-react";
import useAxios from "../../utils/useAxios";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import { useForm } from "@mantine/form";
import AmountInput from "../../components/AmountInput";
import { DatePickerInput } from "@mantine/dates";
import TransactionRow from "../../components/TransactionRow";
import LazyTransactionModal from "../../components/TransactionModal/LazyTransactionModal";
import ListSkeleton from "../../components/ListSkeleton";
import useApiQuery from "../../utils/useApiQuery";
import { trLocaleFilter } from "../../utils/trLocaleFilter";
import { validateEntityName } from "../../validation/rules";
import { TYPE_OPTIONS } from "../../enum/TransactionType";
import {
  buildTransactionFilter,
  EMPTY_FILTER_VALUES,
  FILTER_PARAM,
  parseFilterValues,
  serializeFilterValues,
} from "./transactionFilter";
import { idString } from "../../utils/ids";
import usePagedSearch, { PAGE_PARAM } from "../../utils/usePagedSearch";
import PagedFooter from "../../components/PagedFooter";

export default function Transactions() {
  const callApi = useAxios();
  // The filter and its page both live in the URL, so a refresh or Back keeps them together
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get(FILTER_PARAM);
  const filterValues = parseFilterValues(filterParam);
  const [isFilterOpen, setIsFilterOpen] = useState(filterValues !== null);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);

  // The filter and the page are the only triggers, so each change fetches once and a slow
  // response for an old page or filter is dropped. An emptied last page moves back one page.
  const transactionsQuery = usePagedSearch(
    "transaction/search",
    filterValues ? buildTransactionFilter(filterValues) : {}
  );
  const { pageNo, setPageNo } = transactionsQuery;
  // On failure the account filter stays empty; the rest of the form still works
  const accountsQuery = useApiQuery((signal) =>
    callApi
      .post("account/search", {}, { signal })
      .then((response) => response.data?.content ?? [])
  );
  const isLoading = transactionsQuery.loading;
  const isEnumsLoading = accountsQuery.loading;
  const transactions = transactionsQuery.items;
  const accountList = accountsQuery.data ?? [];
  const accountOptions = accountList.map((account) => ({
    value: idString(account.id),
    label: account.name,
  }));

  /**
   * Shows the first page for these filter values (null: no filter). A new filter and the page reset
   * are one URL change, so it fetches once; an unchanged filter still reloads (explicit search).
   * @param {Record<string, any> | null} values
   */
  const applyFilter = (values) => {
    const nextParam = values ? serializeFilterValues(values) : null;
    if (nextParam === filterParam) {
      transactionsQuery.reload();
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextParam) {
          next.set(FILTER_PARAM, nextParam);
        } else {
          next.delete(FILTER_PARAM);
        }
        next.delete(PAGE_PARAM);
        return next;
      },
      { replace: true }
    );
  };

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: filterValues ?? EMPTY_FILTER_VALUES,

    validate: {
      payeeName: (val) => (val ? validateEntityName(val) : null),
    },
  });

  const renderFilter = () => {
    return (
      <form onSubmit={form.onSubmit((values) => applyFilter(values))}>
        <Group>
          <Select
            label="Transaction Type"
            placeholder="Transaction Type"
            clearable={true}
            data={TYPE_OPTIONS}
            filter={trLocaleFilter}
            {...form.getInputProps("transactionType")}
            searchable
            disabled={isLoading}
            size="md"
          />
          <TextInput
            label="Payee"
            placeholder="Payee"
            maxLength={50}
            {...form.getInputProps("payeeName")}
            disabled={isLoading}
            size="md"
          />
          <AmountInput
            label="Amount"
            placeholder="Transaction Amount"
            form={form}
            fieldName="amount"
            disabled={isLoading}
            size="md"
          ></AmountInput>
          <DatePickerInput
            label="Date"
            placeholder="Transaction date"
            dropdownType="modal"
            highlightToday={true}
            clearable={true}
            {...form.getInputProps("date")}
            disabled={isLoading}
            size="md"
          />
          <Select
            label="Account"
            placeholder="Select Account"
            description="Transactions from or to this account"
            clearable={true}
            data={accountOptions}
            filter={trLocaleFilter}
            {...form.getInputProps("accountId")}
            searchable
            disabled={isLoading || isEnumsLoading}
            size="md"
          />
          <TextInput
            label="Notes"
            placeholder="Notes"
            maxLength={50}
            {...form.getInputProps("notes")}
            disabled={isLoading}
            size="md"
          />
        </Group>
        <Group mt="md" mb="md">
          <Button type="submit" loading={isLoading} size="md">
            Search
          </Button>
          <Button
            variant="light"
            onClick={() => {
              form.setValues(EMPTY_FILTER_VALUES); // not reset(): the initial values may be a filter
              applyFilter(null);
            }}
            disabled={isLoading}
            size="md"
          >
            Clear Filters
          </Button>
        </Group>
      </form>
    );
  };

  const onClickTransactionRow = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModalOpened(true);
  };

  const renderTransactions = () => {
    if (!transactions || transactions.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          No transactions found
        </Text>
      );
    }
    return transactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        transaction={transaction}
        onClick={() => onClickTransactionRow(transaction.id)}
      />
    ));
  };

  const renderContent = () => {
    if (isLoading) {
      return <ListSkeleton />;
    }
    if (transactionsQuery.error) {
      return (
        <LoadError
          title="Couldn't load transactions"
          onRetry={transactionsQuery.retry}
        />
      );
    }
    return renderTransactions();
  };

  return (
    <Container size="lg" px={0}>
      <Group justify="space-between" align="flex-start">
        <PageTitle isBackButtonVisible={true} value="Transactions" />
        <Button
          leftSection={<IconSearch size={16} />}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-expanded={isFilterOpen}
        >
          Filters
        </Button>
      </Group>
      {isFilterOpen && renderFilter()}
      {renderContent()}
      <PagedFooter
        totalPages={transactionsQuery.totalPages}
        pageNo={pageNo}
        onChange={setPageNo}
        disabled={isLoading}
      />
      <LazyTransactionModal
        opened={isTransactionModalOpened}
        close={() => setIsTransactionModalOpened(false)}
        loadedRecentTransactions={transactions}
        transactionId={displayedTransactionId}
        onSaved={transactionsQuery.retry}
      />
    </Container>
  );
}
