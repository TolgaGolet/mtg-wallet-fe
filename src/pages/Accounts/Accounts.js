import {
  Alert,
  Button,
  Card,
  Container,
  Group,
  Skeleton,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import classes from "./Accounts.module.css";
import { IconArrowRight, IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import AmountFormatter from "../../components/AmountFormatter";
import PageTitle from "../../components/PageTitle";

export default function Accounts() {
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [isButtonLoading, setIsButtonLoading] = useState(false);
  let [accountList, setAccountList] = useState([]);

  useEffect(() => {
    callApi.post("account/search", {}).then((response) => {
      setAccountList(response.data?.content);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderAccountCards = () => {
    return accountList.map((account) => (
      <Card
        withBorder
        p="l"
        pr="xs"
        radius="md"
        mb={10}
        key={account.id}
        onClick={() => navigate(`/accounts/${account.id}`, { replace: false })}
        className={classes.accountRow}
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
            <IconArrowRight />
          </div>
        </div>
      </Card>
    ));
  };

  const renderEmptyState = () => {
    return (
      <Alert
        variant="light"
        color="red"
        title="No available accounts"
        icon={<IconInfoCircle />}
      >
        Create a new account.
      </Alert>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderSkeletonCards();
    } else if (accountList.length > 0) {
      return renderAccountCards();
    } else {
      return renderEmptyState();
    }
  };

  const renderSkeletonCards = () => {
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

  const onClickCreateAccount = () => {
    setIsButtonLoading(true);
    navigate("/accounts/create-or-edit/create", { replace: false });
  };

  const renderCreateAccountButton = () => {
    let isAccountLimitReached = accountList?.length >= 40;
    return (
      <Button
        leftSection={<IconPlus size={16} />}
        disabled={isLoading || isAccountLimitReached}
        loading={isButtonLoading}
        onClick={onClickCreateAccount}
      >
        {isAccountLimitReached ? "Account limit reached" : "Add"}
      </Button>
    );
  };

  return (
    <Container size="lg" px={0}>
      <Group justify="space-between" align="flex-start">
        <PageTitle isBackButtonVisible={true} value="Accounts" />
        {renderCreateAccountButton()}
      </Group>
      {renderContent()}
    </Container>
  );
}
