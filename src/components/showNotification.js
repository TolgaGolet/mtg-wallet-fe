import { notifications } from "@mantine/notifications";
import { rem } from "@mantine/core";
import { IconX, IconCheck } from "@tabler/icons-react";

const showNotification = (message, type) => {
  const autoCloseDuration = 5000;

  let notificationConfig;

  if (type === "success") {
    notificationConfig = {
      color: "teal",
      title: "Success",
      message: message,
      icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
      autoClose: autoCloseDuration,
    };
  } else if (type === "error") {
    notificationConfig = {
      color: "red",
      title: "Error",
      message: message,
      icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
      autoClose: autoCloseDuration,
    };
  } else {
    notificationConfig = {
      message: message,
      autoClose: autoCloseDuration,
    };
  }

  return <>{notifications.show(notificationConfig)}</>;
};

export default showNotification;
