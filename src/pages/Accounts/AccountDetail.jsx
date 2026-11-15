import { useState } from "react";
import {
  ActionIcon,
  Box,
  Card,
  Center,
  Container,
  Group,
  Pagination,
  Skeleton,
  Text,
  Title,
  rem,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { Link, useParams } from "react-router-dom";
import AmountFormatter from "../../components/AmountFormatter";
import FieldTextLabel from "../../components/FieldTextLabel";
import FieldTextData from "../../components/FieldTextData";
import { IconPencil } from "@tabler/icons-react";
import TransactionRow from "../../components/TransactionRow";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import NotFoundState from "../../components/NotFoundState";
import ListSkeleton from "../../components/ListSkeleton";
import useApiQuery from "../../utils/useApiQuery";
import { fetchById, isNotFound } from "../../api/fetchById";
import LazyTransactionModal from "../../components/TransactionModal/LazyTransactionModal";

export default function AccountDetail() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const [pageNo, setPageNo] = useState(0);
  // Another account (same component, new route param) starts on its first page
  const [pagedAccountId, setPagedAccountId] = useState(accountId);
  if (pagedAccountId !== accountId) {
    setPagedAccountId(accountId);
    setPageNo(0);
  }
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);

  // Independent loads, so a failure in one still shows the other
  const accountQuery = useApiQuery(
    (signal) => fetchById(callApi, "account", accountId, signal),
    [accountId]
  );
  // The backend OR-s source and target, so this lists every transaction touching the account
  const transactionsQuery = useApiQuery(
    (signal) =>
      callApi
        .post(
          "transaction/search",
          { sourceAccountId: accountId, targetAccountId: accountId },
          { params: { pageNo }, signal }
        )
        .then((response) => response.data),
    [accountId, pageNo],
    {
      // A delete can empty the last page: go to the page that is now last instead of showing
      // "no transactions" with the pagination hidden
      onSuccess: (page) => {
        if (pageNo > 0 && !page?.content?.length) {
          setPageNo(Math.max((page?.totalPages ?? 0) - 1, 0));
        }
      },
    }
  );
  const accountDetails = accountQuery.data;
  const transactions = transactionsQuery.data?.content ?? [];
  const totalPages = transactionsQuery.data?.totalPages ?? 0;

  // A saved transaction changes the balance and the list, so refresh both
  const onTransactionSaved = () => {
    accountQuery.retry();
    transactionsQuery.retry();
  };

  const onClickTransactionRow = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModalOpened(true);
  };

  if (isNotFound(accountQuery.error)) {
    return (
      <NotFoundState
        label="Account"
        title="Account Details"
        listPath="/accounts"
      />
    );
  }

  const renderAccountDetails = () => (
    <Card shadow="sm" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <Box>
          <FieldTextLabel>Name</FieldTextLabel>
          <FieldTextData>{accountDetails?.name}</FieldTextData>
          <FieldTextLabel>Account Type</FieldTextLabel>
          <FieldTextData>{accountDetails?.type?.label}</FieldTextData>
          <FieldTextLabel>Balance</FieldTextLabel>
          <FieldTextData>
            <AmountFormatter value={accountDetails?.balance} />
          </FieldTextData>
          <FieldTextLabel>Currency</FieldTextLabel>
          <FieldTextData>
            {accountDetails?.currency?.value} -{" "}
            {accountDetails?.currency?.label}
          </FieldTextData>
        </Box>
        <ActionIcon
          component={Link}
          to={`/accounts/create-or-edit/${accountId}`}
          variant="default"
          size="lg"
          aria-label="Edit account"
        >
          <IconPencil style={{ width: rem(22), height: rem(22) }} />
        </ActionIcon>
      </Group>
    </Card>
  );

  const renderTransactions = () => {
    if (transactionsQuery.loading) {
      return <ListSkeleton />;
    }
    if (transactionsQuery.error) {
      return (
        <LoadError
          title="Couldn't load the transactions"
          onRetry={transactionsQuery.retry}
        />
      );
    }
    if (transactions.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          No transactions for this account yet
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

  return (
    <Container size="lg" px={0}>
      <PageTitle
        isBackButtonVisible={true}
        backTo="/accounts"
        value="Account Details"
      />
      {accountQuery.loading ? (
        <Skeleton height={272} mt={10} />
      ) : accountQuery.error ? (
        <LoadError
          title="Couldn't load the account"
          onRetry={accountQuery.retry}
        />
      ) : (
        renderAccountDetails()
      )}
      <Title order={2} mb="md" mt="md">
        Transactions
      </Title>
      {renderTransactions()}
      {totalPages > 1 && (
        <Center mb="lg" mt="md">
          <Pagination
            total={totalPages}
            value={pageNo + 1}
            onChange={(value) => setPageNo(value - 1)}
            withEdges
            disabled={transactionsQuery.loading}
          />
        </Center>
      )}
      <LazyTransactionModal
        opened={isTransactionModalOpened}
        close={() => setIsTransactionModalOpened(false)}
        loadedRecentTransactions={transactions}
        transactionId={displayedTransactionId}
        onSaved={onTransactionSaved}
      />
    </Container>
  );
}
