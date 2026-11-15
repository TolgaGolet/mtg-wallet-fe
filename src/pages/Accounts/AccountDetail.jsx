import { useState } from "react";
import {
  ActionIcon,
  Box,
  Card,
  Container,
  Group,
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
import PagedFooter from "../../components/PagedFooter";
import usePagedSearch from "../../utils/usePagedSearch";

export default function AccountDetail() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);

  // Independent loads, so a failure in one still shows the other
  const accountQuery = useApiQuery(
    (signal) => fetchById(callApi, "account", accountId, signal),
    [accountId]
  );
  // The backend OR-s source and target, so this lists every transaction touching the account.
  // The page is in the URL, so another account (a new URL) starts on its first page.
  const transactionsQuery = usePagedSearch("transaction/search", {
    sourceAccountId: accountId,
    targetAccountId: accountId,
  });
  const accountDetails = accountQuery.data;
  const transactions = transactionsQuery.items;

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
      <PagedFooter
        totalPages={transactionsQuery.totalPages}
        pageNo={transactionsQuery.pageNo}
        onChange={transactionsQuery.setPageNo}
        disabled={transactionsQuery.loading}
      />
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
