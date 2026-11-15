// @ts-check
import { Button, Container, Group, Paper, Stack, Text } from "@mantine/core";
import { IconArrowRight, IconInfoCircle, IconPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import usePagedSearch from "../utils/usePagedSearch";
import PageTitle from "./PageTitle";
import LoadError from "./LoadError";
import ListSkeleton from "./ListSkeleton";
import ClickableCard from "./ClickableCard";
import PagedFooter from "./PagedFooter";

/**
 * A paged list page (Accounts, Categories, Payees). By default each card links to the entity's edit
 * form and shows `getSubtitle(item)`; pass `renderItem(item)` to render your own card instead.
 * `basePath` is e.g. "/payees"; the API is `POST <entity>/search` with `pageNo` (kept in `?page=`).
 *
 * @param {object} props
 * @param {string} props.title plural page title, e.g. "Payees"
 * @param {string} props.entity API resource, e.g. "payee"
 * @param {string} props.basePath e.g. "/payees"
 * @param {string} props.singularLabel e.g. "Payee"
 * @param {number} props.limit the per-user cap (DomainLimits); "Add" is disabled when reached
 * @param {(item: any) => string} [props.getSubtitle]
 * @param {(item: any) => import("react").ReactNode} [props.renderItem]
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
  const {
    items,
    totalPages,
    totalElements,
    pageNo,
    setPageNo,
    loading,
    error,
    retry,
  } = usePagedSearch(`${entity}/search`);
  // totalElements counts everything, not just the current page
  const isLimitReached = totalElements >= limit;
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
        // An empty list isn't an error: Mantine's Alert always has role="alert", so not an Alert
        <Paper withBorder p="md" radius="md">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <IconInfoCircle aria-hidden color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={500}>{`No ${title.toLowerCase()} yet`}</Text>
              <Text size="sm" c="dimmed">
                Use the Add button to create a new {lowerLabel}.
              </Text>
            </div>
          </Group>
        </Paper>
      );
    }
    return (
      <Stack gap="sm">
        {items.map((item) => {
          if (renderItem) {
            return renderItem(item);
          }
          const subtitle = getSubtitle?.(item);
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
        {/* A link can't be disabled, so render a plain disabled button instead */}
        {isAddDisabled ? (
          <Button leftSection={<IconPlus size={16} />} disabled>
            {isLimitReached ? `${singularLabel} limit reached` : "Add"}
          </Button>
        ) : (
          <Button
            leftSection={<IconPlus size={16} />}
            component={Link}
            to={`${basePath}/create-or-edit/create`}
          >
            Add
          </Button>
        )}
      </Group>
      {renderContent()}
      <PagedFooter
        totalPages={totalPages}
        pageNo={pageNo}
        onChange={setPageNo}
        disabled={loading}
      />
    </Container>
  );
}
