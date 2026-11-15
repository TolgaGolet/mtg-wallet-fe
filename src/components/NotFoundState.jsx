// @ts-check
import { Button, Container } from "@mantine/core";
import { Link } from "react-router-dom";
import PageTitle from "./PageTitle";
import LoadError from "./LoadError";

/**
 * The "doesn't exist or has been deleted" text for a record of `label` (e.g. "Account").
 * @param {string} label
 */
export const notFoundMessage = (label) =>
  `This ${label.toLowerCase()} doesn't exist or has been deleted.`;

/**
 * The page shown for a record that doesn't exist (or was deleted): title with a back button,
 * the not-found message and a link back to the list.
 * @param {{ label: string, title: string, listPath: string }} props
 */
export default function NotFoundState({ label, title, listPath }) {
  return (
    <Container size="lg" px={0}>
      <PageTitle isBackButtonVisible={true} backTo={listPath} value={title} />
      <LoadError
        title={`${label} not found`}
        message={notFoundMessage(label)}
      />
      <Button component={Link} to={listPath} variant="light" mt="md">
        Back to the list
      </Button>
    </Container>
  );
}
