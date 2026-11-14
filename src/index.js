import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { userTimezone } from "./utils/timezone";

const theme = createTheme({
  /** Put your mantine theme override here */
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <MantineProvider theme={theme} defaultColorScheme="auto">
    <Notifications />
    <ModalsProvider>
      <DatesProvider
        settings={{
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
