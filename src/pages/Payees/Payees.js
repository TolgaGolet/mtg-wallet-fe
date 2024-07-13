import {
  Alert,
  Button,
  Card,
  Center,
  Group,
  Pagination,
  Skeleton,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { IconArrowRight, IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import PageTitle from "../../components/PageTitle";

export default function Payees() {
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [isButtonLoading, setIsButtonLoading] = useState(false);
  let [payeeList, setPayeeList] = useState([]);
  let [totalPages, setTotalPages] = useState(0);
  let [pageNo, setPageNo] = useState(0);

  useEffect(() => {
    callApi
      .post("payee/search", {}, { params: { pageNo: pageNo } })
      .then((response) => {
        setPayeeList(response.data?.content);
        setTotalPages(response.data?.totalPages);
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo]);

  const renderPayeeCards = () => {
    return payeeList.map((payee) => (
      <Card
        withBorder
        key={payee.id}
        onClick={() =>
          navigate(`/payees/create-or-edit/${payee.id}`, {
            replace: false,
          })
        }
      >
        <Group justify="space-between" align="center">
          <div>
            <Text>{payee.name}</Text>
            <Text fz="sm">{payee.categoryName}</Text>
          </div>
          <div>
            <IconArrowRight />
          </div>
        </Group>
      </Card>
    ));
  };

  const renderEmptyState = () => {
    return (
      <Alert
        variant="light"
        color="red"
        title="No available payees"
        icon={<IconInfoCircle />}
      >
        Create a new payee.
      </Alert>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderSkeletonCards();
    } else if (payeeList.length > 0) {
      return renderPayeeCards();
    } else {
      return renderEmptyState();
    }
  };

  const renderSkeletonCards = () => {
    return (
      <>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </>
    );
  };

  const onClickCreatePayee = () => {
    setIsButtonLoading(true);
    navigate("/payees/create-or-edit/create", { replace: false });
  };

  const renderCreatePayeeButton = () => {
    let isPayeeLimitReached = payeeList?.length >= 100;
    return (
      <Button
        leftSection={<IconPlus size={16} />}
        disabled={isLoading || isPayeeLimitReached}
        loading={isButtonLoading}
        onClick={onClickCreatePayee}
      >
        {isPayeeLimitReached ? "Payee limit reached" : "Add"}
      </Button>
    );
  };

  const onChangePagination = (value) => {
    if (value !== pageNo + 1) {
      setIsLoading(true);
      setPageNo(value - 1);
    }
  };

  return (
    <>
      <Group justify="space-between" align="flex-start">
        <PageTitle value="Payees" />
        {renderCreatePayeeButton()}
      </Group>
      {renderContent()}
      {payeeList.length > 0 && (
        <Center mb="lg" mt="md">
          <Pagination
            total={totalPages}
            onChange={onChangePagination}
            withEdges
            disabled={isLoading}
          />
        </Center>
      )}
    </>
  );
}
