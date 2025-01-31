import { useEffect, useState } from "react";
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
import TransactionModal from "../Home/TransactionModal";

export default function AccountDetail() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isAccountDetailsLoading, setIsAccountDetailsLoading] = useState(true);
  let [isLatestTransactionsLoading, setIsLatestTransactionsLoading] =
    useState(true);
  let [accountDetails, setAccountDetails] = useState({});
  let [recentTransactions, setRecentTransactions] = useState([]);
  let [isTransactionModelOpened, setIsTransactionModelOpened] = useState(false);
  let [displayedTransactionId, setDisplayedTransactionId] = useState(null);

  useEffect(() => {
    callApi.post("account/search", { id: accountId }).then((response) => {
      setAccountDetails(response.data?.content[0]);
      setIsAccountDetailsLoading(false);
      callApi
        .post(
          "transaction/search",
          { sourceAccountId: accountId, targetAccountId: accountId },
          { params: { pageNo: 0 } }
        )
        .then((response) => {
          setRecentTransactions(response.data?.content);
          setIsLatestTransactionsLoading(false);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            aria-label="Edit"
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

  const renderRecentTransactions = () => {
    return recentTransactions.map((transaction) => (
      <TransactionRow
        key={transaction.id}
        payee={transaction.payee?.name}
        category={transaction.payee?.category?.name}
        parentCategory={transaction.payee?.category?.parentCategory?.name}
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
    setIsTransactionModelOpened(true);
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle isBackButtonVisible={true} value="Account Details" />
      {isAccountDetailsLoading
        ? renderSkeletonAccountDetails()
        : renderAccountDetails()}
      <Title order={2} mb="md" mt="md">
        Recent Transactions
      </Title>
      {isLatestTransactionsLoading
        ? renderSkeletonRecentTransactions()
        : renderRecentTransactions()}
      <TransactionModal
        opened={isTransactionModelOpened}
        close={() => setIsTransactionModelOpened(false)}
        loadedRecentTransactions={recentTransactions}
        transactionId={displayedTransactionId}
      ></TransactionModal>
    </Container>
  );
}
