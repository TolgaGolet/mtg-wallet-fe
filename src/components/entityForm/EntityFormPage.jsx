// @ts-check
import {
  Box,
  Button,
  Container,
  Fieldset,
  LoadingOverlay,
} from "@mantine/core";
import PageTitle from "../PageTitle";
import LoadError from "../LoadError";
import NotFoundState from "../NotFoundState";

/**
 * @typedef {object} EntityFormPageProps
 * @property {ReturnType<typeof import("./useEntityForm").default>} entityForm what useEntityForm returned
 * @property {import("react").ReactNode} children the form fields
 */

/**
 * The page around a create/edit form: title with a back button, load error or "not found",
 * a loading overlay, and the Save/Create and Delete buttons.
 * @param {EntityFormPageProps} props
 */
export default function EntityFormPage({ entityForm, children }) {
  const {
    isEdit,
    label,
    listPath,
    isLoading,
    loadError,
    notFound,
    retry,
    onSubmit,
    confirmDelete,
  } = entityForm;
  const lowerLabel = label.toLowerCase();
  const title = isEdit ? `Edit ${label}` : `Create a New ${label}`;

  if (notFound) {
    return <NotFoundState label={label} title={title} listPath={listPath} />;
  }

  return (
    <Container size="lg" px={0}>
      <PageTitle isBackButtonVisible={true} backTo={listPath} value={title} />
      {loadError && (
        <LoadError mb="md" title="Couldn't load the form" onRetry={retry} />
      )}
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset
          legend={`${label} information`}
          disabled={isLoading || loadError}
        >
          <form onSubmit={onSubmit}>
            {children}
            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              mt="xl"
              size="md"
            >
              {isEdit ? "Save" : "Create"}
            </Button>
            {isEdit && (
              <Button
                loading={isLoading}
                fullWidth
                mt="md"
                size="md"
                color="red"
                onClick={confirmDelete}
              >
                Delete this {lowerLabel}
              </Button>
            )}
          </form>
        </Fieldset>
      </Box>
    </Container>
  );
}
