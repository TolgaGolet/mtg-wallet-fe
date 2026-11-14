import { useState } from "react";
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Pagination,
  Stack,
  Text,
} from "@mantine/core";
import { IconArrowRight, IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import useAxios from "../utils/useAxios";
import useApiQuery from "../utils/useApiQuery";
import PageTitle from "./PageTitle";
import LoadError from "./LoadError";
import ListSkeleton from "./ListSkeleton";
import ClickableCard from "./ClickableCard";

/**
 * A paged list page (Accounts, Categories, Payees). By default each card links to the entity's edit
 * form and shows `getSubtitle(item)`; pass `renderItem(item)` to render your own card instead.
 * `basePath` is e.g. "/payees"; the API is `POST <entity>/search` with `pageNo`.
 */
export default function PagedEntityList({
  title,
  entity,
  basePath,
  singularLabel,
  limit,
  getSubtitle,
  renderItem,
}) {
  const callApi = useAxios();
  const [pageNo, setPageNo] = useState(0);
  const { data, loading, error, retry } = useApiQuery(
    (signal) =>
      callApi
        .post(`${entity}/search`, {}, { params: { pageNo }, signal })
        .then((response) => response.data),
    [entity, pageNo]
  );
  const items = data?.content ?? [];
  // totalElements counts everything, not just the current page
  const isLimitReached = (data?.totalElements ?? 0) >= limit;
  const isAddDisabled = loading || isLimitReached;
  const lowerLabel = singularLabel.toLowerCase();

  const renderContent = () => {
    if (loading) {
      return <ListSkeleton count={10} height={80} />;
    }
    if (error) {
      return (
        <LoadError
          title={`Couldn't load ${title.toLowerCase()}`}
          onRetry={retry}
        />
      );
    }
    if (items.length === 0) {
      return (
        <Alert
          variant="light"
          color="red"
          title={`No available ${title.toLowerCase()}`}
          icon={<IconInfoCircle />}
        >
          Create a new {lowerLabel}.
        </Alert>
      );
    }
    return (
      <Stack gap="sm">
        {items.map((item) => {
          if (renderItem) {
            return renderItem(item);
          }
          const subtitle = getSubtitle(item);
          return (
            <ClickableCard
              withBorder
              key={item.id}
              to={`${basePath}/create-or-edit/${item.id}`}
              aria-label={`Edit ${lowerLabel} ${item.name}${subtitle ? `, ${subtitle}` : ""}`}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text>{item.name}</Text>
                  <Text fz="sm">{subtitle || "-"}</Text>
                </div>
                <IconArrowRight aria-hidden />
              </Group>
            </ClickableCard>
          );
        })}
      </Stack>
    );
  };

  return (
    <Container size="lg" px={0}>
      <Group justify="space-between" align="flex-start">
        <PageTitle isBackButtonVisible={true} value={title} />
        <Button
          leftSection={<IconPlus size={16} />}
          // A link can't be disabled, so render a plain disabled button instead
          {...(isAddDisabled
            ? { disabled: true }
            : { component: Link, to: `${basePath}/create-or-edit/create` })}
        >
          {isLimitReached ? `${singularLabel} limit reached` : "Add"}
        </Button>
      </Group>
      {renderContent()}
      {items.length > 0 && (
        <Center mb="lg" mt="md">
          <Pagination
            total={data?.totalPages ?? 0}
            value={pageNo + 1}
            onChange={(value) => setPageNo(value - 1)}
            withEdges
            disabled={loading}
          />
        </Center>
      )}
    </Container>
  );
}
