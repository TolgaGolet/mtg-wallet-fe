import { Alert, Button } from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

/**
 * Shown in place of content whose request failed, so a failed load never leaves a skeleton
 * on screen. The API client has already shown the error toast.
 */
export default function LoadError({
  title = "Couldn't load data",
  message = "Something went wrong while loading. Check your connection and try again.",
  onRetry,
  ...props
}) {
  return (
    <Alert
      variant="light"
      color="red"
      title={title}
      icon={<IconAlertCircle />}
      role="alert"
      {...props}
    >
      {message}
      {onRetry && (
        <div>
          <Button
            mt="sm"
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconRefresh size={14} />}
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      )}
    </Alert>
  );
}
