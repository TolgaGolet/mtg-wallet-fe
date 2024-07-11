import { Alert, Button, Card, Skeleton, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import classes from "./Accounts.module.css";
import { IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import AmountFormatter from "../../components/AmountFormatter";

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
        radius="md"
        mb={10}
        className={classes.card}
        key={account.id}
        onClick={() => navigate(`/accounts/${account.id}`, { replace: false })}
      >
        <div className={classes.inner}>
          <div>
            <Text fz="xl" className={classes.label}>
              {account.name}
            </Text>
            <Text fz="sm">{account.type.label}</Text>
          </div>

          <div
            className={`${classes.balance} ${
              account.balance < 0 ? classes.negativeBalance : ""
            }`}
          >
            <AmountFormatter
              prefix={account.currency.value}
              value={account.balance}
            />
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
    navigate("/accounts/create", { replace: false });
  };

  const renderCreateAccountButton = () => {
    let isAccountLimitReached = accountList?.length >= 15;
    return (
      <Button
        justify="center"
        fullWidth
        leftSection={<IconPlus size={14} />}
        mt="md"
        mb={50}
        size="lg"
        disabled={isLoading || isAccountLimitReached}
        loading={isButtonLoading}
        onClick={onClickCreateAccount}
      >
        {isAccountLimitReached ? "Account limit reached" : "Create an account"}
      </Button>
    );
  };

  return (
    <>
      <Title order={2} mb="md">
        Accounts
      </Title>
      {renderContent()}
      {renderCreateAccountButton()}
    </>
  );
}
