import { Fragment } from "react";
import { Divider, Stack, Text } from "@mantine/core";
import TransactionRow from "../../components/TransactionRow";
import LoadError from "../../components/LoadError";
import ListSkeleton from "../../components/ListSkeleton";
import { DATE_GROUP_ORDER, getDateGroup } from "../../utils/dates";

/**
 * The latest transactions, grouped by date (Today, Yesterday, ...). Home owns the query, because
 * the transaction dialog reuses the same list for its suggestions.
 *
 * @param {{ transactions: any[] | null, loading: boolean, error: any, onRetry: () => void, onSelect: (id: number) => void }} props
 */
export default function RecentTransactions({
  transactions,
  loading,
  error,
  onRetry,
  onSelect,
}) {
  if (loading) {
    return <ListSkeleton />;
  }
  if (error) {
    return (
      <LoadError title="Couldn't load recent transactions" onRetry={onRetry} />
    );
  }
  if (!transactions || transactions.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No recent transactions
      </Text>
    );
  }

  const groups = {};
  for (const transaction of transactions) {
    (groups[getDateGroup(transaction.dateTime)] ??= []).push(transaction);
  }

  return (
    <Stack>
      {DATE_GROUP_ORDER.filter((group) => groups[group]?.length).map(
        (group) => (
          <Fragment key={group}>
            <Divider
              label={
                <Text fw={250} size="sm">
                  {group}
                </Text>
              }
              labelPosition="left"
            />
            {/* The backend already sorts by dateTime, newest first */}
            {groups[group].map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onClick={() => onSelect(transaction.id)}
              />
            ))}
          </Fragment>
        )
      )}
    </Stack>
  );
}
