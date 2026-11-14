import { Text } from "@mantine/core";
import classes from "./Accounts.module.css";
import { IconArrowRight } from "@tabler/icons-react";
import AmountFormatter from "../../components/AmountFormatter";
import ClickableCard from "../../components/ClickableCard";
import PagedEntityList from "../../components/PagedEntityList";
import { LIMITS } from "../../validation/rules";
import { formatAmount } from "../../utils/format";

const renderAccountCard = (account) => (
  <ClickableCard
    withBorder
    p="l"
    pr="xs"
    radius="md"
    key={account.id}
    to={`/accounts/${account.id}`}
    aria-label={`${account.name}, ${account.type?.label}, balance ${formatAmount(account.balance)} ${account.currency?.value}`}
  >
    <div className={classes.inner}>
      <div>
        <Text fz="xl" className={classes.label}>
          {account.name}
        </Text>
        <Text fz="sm">{account.type?.label}</Text>
      </div>

      <div
        className={`${classes.balance} ${
          account.balance < 0 ? classes.negativeBalance : ""
        }`}
      >
        <AmountFormatter
          prefix={account.currency?.value}
          value={account.balance}
        />
      </div>
      <div className={classes.rightArrow}>
        <IconArrowRight aria-hidden />
      </div>
    </div>
  </ClickableCard>
);

export default function Accounts() {
  return (
    <PagedEntityList
      title="Accounts"
      entity="account"
      basePath="/accounts"
      singularLabel="Account"
      limit={LIMITS.accounts}
      renderItem={renderAccountCard}
    />
  );
}
