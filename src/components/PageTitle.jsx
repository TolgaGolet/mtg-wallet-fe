// @ts-check
import { ActionIcon, Group, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {object} PageTitleProps
 * @property {import("react").ReactNode} value the title text
 * @property {boolean} [isBackButtonVisible]
 * @property {string} [backTo] where the back button goes when there is no in-app history
 *   (the page was opened directly or from a bookmark); defaults to Home
 * @property {import("@mantine/core").TitleOrder} [titleOrder]
 */

/** @param {PageTitleProps & Omit<import("@mantine/core").GroupProps, "title">} props */
export default function PageTitle({
  isBackButtonVisible,
  value,
  titleOrder,
  backTo = "/",
  ...props
}) {
  const navigate = useNavigate();
  const goBack = () => {
    // The router numbers its history entries; idx 0 means this is the first page of the app,
    // so history.back() would leave it
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(backTo, { replace: true });
    }
  };
  return (
    <Group justify="flex-start" align="center" gap="xs" mb="md" {...props}>
      {isBackButtonVisible && (
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={goBack}
          aria-label="Go back"
        >
          <IconArrowLeft />
        </ActionIcon>
      )}
      <Title order={titleOrder || 2}>{value}</Title>
    </Group>
  );
}
