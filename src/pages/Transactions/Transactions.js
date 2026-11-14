import {
  Button,
  Center,
  Container,
  Group,
  Pagination,
  TextInput,
  Text,
  Select,
} from "@mantine/core";
import { useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import useAxios from "../../utils/useAxios";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import { useForm } from "@mantine/form";
import AmountInput from "../../components/AmountInput";
import { DatePickerInput } from "@mantine/dates";
import TransactionRow from "../../components/TransactionRow";
import TransactionModal from "../../components/TransactionModal/TransactionModal";
import ListSkeleton from "../../components/ListSkeleton";
import useApiQuery from "../../utils/useApiQuery";
import { trLocaleFilter } from "../../utils/trLocaleFilter";
import { validateEntityName } from "../../validation/rules";

export default function Transactions() {
  const callApi = useAxios();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pageNo, setPageNo] = useState(0);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [currentFilter, setCurrentFilter] = useState(null);

  // The filter and the page are the only triggers, so each change fetches exactly once and a
  // slow response for an old page or filter is dropped
  const transactionsQuery = useApiQuery(
    (signal) =>
      callApi
        .post("transaction/search", currentFilter || {}, {
          params: { pageNo },
          signal,
        })
        .then((response) => response.data),
    [currentFilter, pageNo]
  );
  // On failure the account filters stay empty; the rest of the form still works
  const accountsQuery = useApiQuery((signal) =>
    callApi
      .post("account/search", {}, { signal })
      .then((response) => response.data?.content ?? [])
  );
  const isLoading = transactionsQuery.loading;
  const isEnumsLoading = accountsQuery.loading;
  const transactions = transactionsQuery.data?.content ?? [];
  const totalPages = transactionsQuery.data?.totalPages ?? 0;
  const accountList = accountsQuery.data ?? [];
  const accountOptions = accountList.map((account) => ({
    value: account.id + "",
    label: account.name,
  }));

  const handleFilterSubmit = (e) => {
    const request = {
      ...e,
      typeValue: e.transactionType,
      payeeName: e.payeeName ? e.payeeName : null,
      dateTime: e.date ? e.date : null,
      sourceAccountId: e.sourceAccountId ? parseInt(e.sourceAccountId) : null,
      targetAccountId: e.targetAccountId ? parseInt(e.targetAccountId) : null,
      notes: e.notes ? e.notes : null,
    };
    setCurrentFilter(request);
    setPageNo(0); // Reset pagination on filter submit
    // An explicit search always reloads, even with an unchanged filter (deps are compared by value).
    // Batched with the state updates above, so a changed filter still fetches only once.
    transactionsQuery.retry();
  };

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      transactionType: null,
      payeeName: null,
      amount: null,
      date: null,
      sourceAccountId: null,
      targetAccountId: null,
      notes: "",
    },

    validate: {
      payeeName: (val) => (val ? validateEntityName(val) : null),
    },
  });

  const renderFilter = () => {
    return (
      <form
        onSubmit={form.onSubmit((e) => {
          handleFilterSubmit(e);
        })}
      >
        <Group>
          <Select
            label="Transaction Type"
            placeholder="Transaction Type"
            clearable={true}
            data={[
              { value: "EXP", label: "Expense" },
              { value: "INC", label: "Income" },
              { value: "TRA", label: "Transfer" },
            ]}
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
            min={0.01}
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
            label="Source Account"
            placeholder="Select Source Account"
            clearable={true}
            data={accountOptions}
            filter={trLocaleFilter}
            {...form.getInputProps("sourceAccountId")}
            searchable
            disabled={isLoading}
            size="md"
          />
          <Select
            label="Target Account"
            placeholder="Select Target Account"
            clearable={true}
            data={accountOptions}
            filter={trLocaleFilter}
            {...form.getInputProps("targetAccountId")}
            searchable
            disabled={isLoading}
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
          <Button type="submit" loading={isEnumsLoading} size="md">
            Search
          </Button>
          <Button
            variant="light"
            onClick={() => {
              form.reset();
              setCurrentFilter(null);
              setPageNo(0);
            }}
            disabled={isEnumsLoading}
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
        payee={transaction.payee?.name}
        category={transaction.payee?.category?.name}
        parentCategory={transaction.payee?.category?.parentCategoryName}
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

  const onChangePagination = (value) => {
    if (value !== pageNo + 1) {
      setPageNo(value - 1);
    }
  };

  return (
    <Container size="lg" px={0}>
      <Group justify="space-between" align="flex-start">
        <PageTitle isBackButtonVisible={true} value="Transactions" />
        <Button
          leftSection={<IconSearch size={16} />}
          disabled={isEnumsLoading}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          Filters
        </Button>
      </Group>
      {isFilterOpen && renderFilter()}
      {renderContent()}
      {transactions.length > 0 && (
        <Center mb="lg" mt="md">
          <Pagination
            total={totalPages}
            value={pageNo + 1}
            onChange={onChangePagination}
            withEdges
            disabled={isLoading}
          />
        </Center>
      )}
      <TransactionModal
        opened={isTransactionModalOpened}
        close={() => setIsTransactionModalOpened(false)}
        loadedRecentTransactions={transactions}
        transactionId={displayedTransactionId}
        onSaved={transactionsQuery.retry}
      ></TransactionModal>
    </Container>
  );
}
