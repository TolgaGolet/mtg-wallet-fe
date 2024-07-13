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

export default function Categories() {
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [isButtonLoading, setIsButtonLoading] = useState(false);
  let [categoryList, setCategoryList] = useState([]);
  let [totalPages, setTotalPages] = useState(0);
  let [pageNo, setPageNo] = useState(0);

  useEffect(() => {
    callApi
      .post("category/search", {}, { params: { pageNo: pageNo } })
      .then((response) => {
        setCategoryList(response.data?.content);
        setTotalPages(response.data?.totalPages);
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo]);

  const renderCategoryCards = () => {
    return categoryList.map((category) => (
      <Card
        withBorder
        key={category.id}
        onClick={() =>
          navigate(`/categories/create-or-edit/${category.id}`, {
            replace: false,
          })
        }
      >
        <Group justify="space-between" align="center">
          <div>
            <Text>{category.name}</Text>
            <Text fz="sm">{category.parentCategoryName || "-"}</Text>
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
        title="No available categories"
        icon={<IconInfoCircle />}
      >
        Create a new category.
      </Alert>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return renderSkeletonCards();
    } else if (categoryList.length > 0) {
      return renderCategoryCards();
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

  const onClickCreateCategory = () => {
    setIsButtonLoading(true);
    navigate("/categories/create-or-edit/create", { replace: false });
  };

  const renderCreateCategoryButton = () => {
    let isCategoryLimitReached = categoryList?.length >= 50;
    return (
      <Button
        leftSection={<IconPlus size={16} />}
        disabled={isLoading || isCategoryLimitReached}
        loading={isButtonLoading}
        onClick={onClickCreateCategory}
      >
        {isCategoryLimitReached ? "Category limit reached" : "Add"}
      </Button>
    );
  };

  return (
    <>
      <Group justify="space-between" align="flex-start">
        <PageTitle value="Categories" />
        {renderCreateCategoryButton()}
      </Group>
      {renderContent()}
      {categoryList.length > 0 && (
        <Center mb="lg" mt="md">
          <Pagination
            total={totalPages}
            onChange={(value) => {
              setIsLoading(true);
              setPageNo(value - 1);
            }}
            withEdges
            disabled={isLoading}
          />
        </Center>
      )}
    </>
  );
}
