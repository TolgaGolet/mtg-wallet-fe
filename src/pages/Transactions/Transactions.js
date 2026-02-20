import {
  Button,
  Center,
  Container,
  Group,
  Pagination,
  Skeleton,
  TextInput,
  Text,
  Select,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import useAxios from "../../utils/useAxios";
import PageTitle from "../../components/PageTitle";
import { useForm } from "@mantine/form";
import AmountInput from "../../components/AmountInput";
import { DatePickerInput } from "@mantine/dates";
import TransactionRow from "../../components/TransactionRow";
import TransactionModal from "../Home/TransactionModal";

export default function Transactions() {
  const callApi = useAxios();
  let [isLoading, setIsLoading] = useState(true);
  let [isEnumsLoading, setIsEnumsLoading] = useState(true);
  let [accountList, setAccountList] = useState([]);
  let [isFilterOpen, setIsFilterOpen] = useState(false);
  let [transactions, setTransactions] = useState([]);
  let [totalPages, setTotalPages] = useState(0);
  let [pageNo, setPageNo] = useState(0);
  let [displayedTransactionId, setDisplayedTransactionId] = useState(null);
  let [isTransactionModelOpened, setIsTransactionModelOpened] = useState(false);
  let [currentFilter, setCurrentFilter] = useState(null);

  const fetchTransactions = (filterData, page) => {
    setIsLoading(true);
    const request = filterData || {};

    callApi
      .post("transaction/search", request, { params: { pageNo: page } })
      .then((response) => {
        setTransactions(response.data?.content);
        setTotalPages(response.data?.totalPages);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions(currentFilter, pageNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo]);

  useEffect(() => {
    setIsEnumsLoading(true);
    callApi.post("account/search", {}).then((response) => {
      setAccountList(response.data?.content);
      setIsEnumsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchTransactions(request, 0);
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
      payeeName: (val) =>
        val &&
        (val?.length > 50 ||
          val?.length < 3 ||
          !/^[a-zA-Z0-9\sçğıöşüÇĞİÖŞÜ]+$/.test(val))
          ? "Name must be 3 - 50 characters and contain only letters, numbers and spaces"
          : null,
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
            filter={({ options, search }) =>
              options.filter((option) =>
                option.label
                  .toLocaleLowerCase("tr-TR")
                  .includes(search.toLocaleLowerCase("tr-TR"))
              )
            }
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
            data={accountList.map((account) => ({
              value: account.id + "",
              label: account.name,
            }))}
            filter={({ options, search }) =>
              options.filter((option) =>
                option.label
                  .toLocaleLowerCase("tr-TR")
                  .includes(search.toLocaleLowerCase("tr-TR"))
              )
            }
            {...form.getInputProps("sourceAccountId")}
            searchable
            disabled={isLoading}
            size="md"
          />
          <Select
            label="Target Account"
            placeholder="Select Target Account"
            clearable={true}
            data={accountList.map((account) => ({
              value: account.id + "",
              label: account.name,
            }))}
            filter={({ options, search }) =>
              options.filter((option) =>
                option.label
                  .toLocaleLowerCase("tr-TR")
                  .includes(search.toLocaleLowerCase("tr-TR"))
              )
            }
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
              fetchTransactions(null, 0);
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
    setIsTransactionModelOpened(true);
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

  const renderContent = () => {
    return isLoading ? renderSkeletonTransactions() : renderTransactions();
  };

  const renderSkeletonTransactions = () => {
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
        opened={isTransactionModelOpened}
        close={() => setIsTransactionModelOpened(false)}
        loadedRecentTransactions={transactions}
        transactionId={displayedTransactionId}
      ></TransactionModal>
    </Container>
  );
}
