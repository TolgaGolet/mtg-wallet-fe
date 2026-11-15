import { useContext, useState } from "react";
import { Anchor, Container, Group, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import useAxios from "../../utils/useAxios";
import useApiQuery from "../../utils/useApiQuery";
import LazyTransactionModal from "../../components/TransactionModal/LazyTransactionModal";
import classes from "./Home.module.css";
import NetValueCard from "./NetValueCard";
import ShortcutGrid from "./ShortcutGrid";
import RecentTransactions from "./RecentTransactions";

/** Home: the cards plus the transaction dialog, and refreshing the cards after a save. */
export default function Home() {
  const { user } = useContext(AuthContext);
  const callApi = useAxios();
  const [isTransactionModalOpened, setIsTransactionModalOpened] =
    useState(false);
  const [displayedTransactionId, setDisplayedTransactionId] = useState(null);
  // Bumped after a save, so the net value card refetches
  const [netValueReloadKey, setNetValueReloadKey] = useState(0);

  // Here, not in RecentTransactions: the dialog reuses them for its suggestions
  const recentTransactionsQuery = useApiQuery((signal) =>
    callApi
      .post("transaction/search", {}, { params: { pageNo: 0 }, signal })
      .then((response) => response.data?.content ?? [])
  );
  const recentTransactions = recentTransactionsQuery.data ?? null;

  // After a save in the modal, refresh only what Home shows
  const onTransactionSaved = () => {
    recentTransactionsQuery.retry();
    setNetValueReloadKey((key) => key + 1);
  };

  const openTransaction = (id) => {
    setDisplayedTransactionId(id);
    setIsTransactionModalOpened(true);
  };

  return (
    <Container size="lg" px={0}>
      <Text fw={500}>Hello {user?.sub} 👋</Text>
      <NetValueCard reloadKey={netValueReloadKey} />
      <ShortcutGrid
        onCreateTransaction={() => openTransaction(null)}
        // The dialog reuses Home's recent transactions, so wait until they are loaded
        createDisabled={recentTransactionsQuery.loading}
      />
      <Group justify="space-between" mb="md" mt="md">
        <Title order={3}>Recent Transactions</Title>
        <Anchor
          component={Link}
          to="/transactions"
          size="sm"
          c="dimmed"
          className={classes.seeAllButton}
        >
          See All →
        </Anchor>
      </Group>
      <RecentTransactions
        transactions={recentTransactions}
        loading={recentTransactionsQuery.loading}
        error={recentTransactionsQuery.error}
        onRetry={recentTransactionsQuery.retry}
        onSelect={openTransaction}
      />
      <LazyTransactionModal
        opened={isTransactionModalOpened}
        close={() => setIsTransactionModalOpened(false)}
        loadedRecentTransactions={recentTransactions}
        transactionId={displayedTransactionId}
        onSaved={onTransactionSaved}
      />
    </Container>
  );
}
