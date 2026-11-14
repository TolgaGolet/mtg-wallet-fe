import { useState } from "react";
import {
  ActionIcon,
  Box,
  Card,
  Container,
  Group,
  Skeleton,
  Title,
  rem,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { useNavigate, useParams } from "react-router-dom";
import AmountFormatter from "../../components/AmountFormatter";
import FieldTextLabel from "../../components/FieldTextLabel";
import FieldTextData from "../../components/FieldTextData";
import { IconPencil } from "@tabler/icons-react";
import TransactionRow from "../../components/TransactionRow";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import ListSkeleton from "../../components/ListSkeleton";
import useApiQuery from "../../utils/useApiQuery";
import TransactionModal from "../../components/TransactionModal/TransactionModal";

export default function AccountDetail() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);

  // Independent loads, so a failure in one still shows the other
  const accountQuery = useApiQuery(
    (signal) =>
      callApi
        .post("account/search", { id: accountId }, { signal })
        .then((response) => response.data?.content?.[0] ?? {}),
    [accountId]
  );
  const transactionsQuery = useApiQuery(
    (signal) =>
      callApi
        .post(
          "transaction/search",
          { sourceAccountId: accountId, targetAccountId: accountId },
          { params: { pageNo: 0 }, signal }
        )
        .then((response) => response.data?.content ?? []),
    [accountId]
  );
  const accountDetails = accountQuery.data ?? {};
  const recentTransactions = transactionsQuery.data ?? [];

  // A saved transaction changes the balance and the list, so refresh both
  const onTransactionSaved = () => {
    accountQuery.retry();
    transactionsQuery.retry();
  };

  const renderSkeletonAccountDetails = () => {
    return <Skeleton height={272} mt={10} />;
  };

  const renderAccountDetails = () => {
    return (
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
            variant="default"
            size="lg"
            aria-label="Edit account"
            onClick={() => {
              navigate(`/accounts/create-or-edit/${accountDetails?.id}`, {
                replace: false,
              });
            }}
          >
            <IconPencil style={{ width: rem(22), height: rem(22) }} />
          </ActionIcon>
        </Group>
      </Card>
    );
  };

  const renderRecentTransactions = () => {
    return recentTransactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        payee={transaction.payee?.name}
        category={transaction.payee?.category?.name}
        parentCategory={transaction.payee?.category?.parentCategoryName}
        typeValue={transaction.type?.value}
        amount={transaction.amount}
        currencyValue={accountDetails?.currency?.value}
        dateTime={transaction.dateTime}
        sourceAccount={transaction.sourceAccount?.name}
        targetAccount={transaction.targetAccount?.name}
        onClick={() => onClickTransactionRow(transaction.id)}
      ></TransactionRow>
    ));
  };

  const onClickTransactionRow = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModalOpened(true);
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle isBackButtonVisible={true} value="Account Details" />
      {accountQuery.loading ? (
        renderSkeletonAccountDetails()
      ) : accountQuery.error ? (
        <LoadError
          title="Couldn't load the account"
          onRetry={accountQuery.retry}
        />
      ) : (
        renderAccountDetails()
      )}
      <Title order={2} mb="md" mt="md">
        Recent Transactions
      </Title>
      {transactionsQuery.loading ? (
        <ListSkeleton />
      ) : transactionsQuery.error ? (
        <LoadError
          title="Couldn't load recent transactions"
          onRetry={transactionsQuery.retry}
        />
      ) : (
        renderRecentTransactions()
      )}
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
