import { notifications } from "@mantine/notifications";
import { rem } from "@mantine/core";
import { IconX, IconCheck } from "@tabler/icons-react";

let notificationCount = 0;
let lastResetTime = Date.now();

const showNotification = (message, type) => {
  const autoCloseDuration = 5000;
  const currentTime = Date.now();
  const maxNotifications = 5;

  // Reset counter if 5 seconds have passed
  if (currentTime - lastResetTime >= 5000) {
    notificationCount = 0;
    lastResetTime = currentTime;
  }

  // Ignore if max notifications reached within 5s window
  if (notificationCount >= maxNotifications) {
    return;
  }

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

  notifications.show(notificationConfig);
  notificationCount++;
};

export default showNotification;
