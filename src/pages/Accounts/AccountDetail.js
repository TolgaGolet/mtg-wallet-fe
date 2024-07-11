import { useEffect, useState } from "react";
import {
  ActionIcon,
  Box,
  Card,
  Group,
  Skeleton,
  Title,
  rem,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { useParams } from "react-router-dom";
import AmountFormatter from "../../components/AmountFormatter";
import FieldTextLabel from "../../components/FieldTextLabel";
import FieldTextData from "../../components/FieldTextData";
import { IconPencil } from "@tabler/icons-react";
import TransactionRow from "../../components/TransactionRow";

export default function AccountDetail() {
  const { accountId } = useParams();
  const callApi = useAxios();
  let [isAccountDetailsLoading, setIsAccountDetailsLoading] = useState(true);
  let [isLatestTransactionsLoading, setIsLatestTransactionsLoading] =
    useState(true);
  let [accountDetails, setAccountDetails] = useState({});
  let [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    callApi.post("account/search", { id: accountId }).then((response) => {
      setAccountDetails(response.data?.content[0]);
      setIsAccountDetailsLoading(false);
    });
    callApi
      .post(
        "transaction/search",
        { sourceAccountId: accountId },
        { params: { pageNo: 0 } }
      )
      .then((response) => {
        setRecentTransactions(response.data?.content);
        setIsLatestTransactionsLoading(false);
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
            <FieldTextData>{accountDetails?.type?.value}</FieldTextData>
            <FieldTextLabel>Balance</FieldTextLabel>
            <FieldTextData>
              <AmountFormatter value={accountDetails?.balance} />
            </FieldTextData>
            <FieldTextLabel>Currency</FieldTextLabel>
            <FieldTextData>{accountDetails?.currency?.value}</FieldTextData>
          </Box>
          <ActionIcon variant="default" size="lg" aria-label="Edit">
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
      ></TransactionRow>
    ));
  };

  return (
    <>
      <Title order={2} mb="md">
        Account Details
      </Title>
      {isAccountDetailsLoading
        ? renderSkeletonAccountDetails()
        : renderAccountDetails()}
      <Title order={2} mb="md" mt="md">
        Recent Transactions
      </Title>
      {isLatestTransactionsLoading
        ? renderSkeletonRecentTransactions()
        : renderRecentTransactions()}
    </>
  );
}
