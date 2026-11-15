import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { DatesProvider } from "@mantine/dates";
import { userTimezone } from "./utils/timezone";

const root = ReactDOM.createRoot(document.getElementById("root"));

// StrictMode runs effects twice in development to surface missing cleanups; pages that consume
// single-use tokens (TokenActionPage) post them only once
root.render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
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
  </StrictMode>
);
