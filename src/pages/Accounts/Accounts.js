import {
  Alert,
  Button,
  Card,
  NumberFormatter,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import classes from "./Accounts.module.css";
import { IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";

export default function Accounts() {
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [isButtonLoading, setIsButtonLoading] = useState(false);
  let [accountList, setAccountList] = useState([]);

  useEffect(() => {
    callApi.get("account/get-users-all").then((response) => {
      setAccountList(response.data);
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
        className={classes.card}
        key={account.id}
        mt={10}
      >
        <div className={classes.inner}>
          <div>
            <Text fz="xl" className={classes.label}>
              {account.name}
            </Text>
            <Text fz="sm">{account.type.value}</Text>
          </div>

          <div className={classes.balance}>
            <NumberFormatter
              prefix={account.currency.value + " "}
              value={account.balance}
              thousandSeparator
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
        mt={10}
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
      </>
    );
  };

  const onClickCreateAccount = () => {
    setIsButtonLoading(true);
    navigate("/accounts/create", { replace: false });
  };

  const renderCreateAccountButton = () => {
    return (
      <Button
        justify="center"
        fullWidth
        leftSection={<IconPlus size={14} />}
        mt="md"
        disabled={isLoading}
        loading={isButtonLoading}
        onClick={onClickCreateAccount}
      >
        Create an account
      </Button>
    );
  };

  return (
    <>
      <Title order={2}>Accounts</Title>
      {renderContent()}
      {renderCreateAccountButton()}
    </>
  );
}
