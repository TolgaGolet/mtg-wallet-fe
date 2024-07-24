import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/tiptap/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/nprogress/styles.css";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const root = ReactDOM.createRoot(document.getElementById("root"));
export const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const userTimezoneOffsetInHours = -new Date().getTimezoneOffset() / 60;

root.render(
  <MantineProvider theme={theme} defaultColorScheme="auto">
    <Notifications />
    <ModalsProvider>
      <DatesProvider
        settings={{
          // locale: "tr", import "dayjs/locale/tr";
          firstDayOfWeek: 1,
          weekendDays: [0, 6],
          timezone: userTimezone || "UTC",
        }}
      >
        <App />
      </DatesProvider>
    </ModalsProvider>
  </MantineProvider>
);
