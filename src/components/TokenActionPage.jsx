// @ts-check
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Center,
  Container,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import {
  getErrorMessage,
  NETWORK_ERROR_MESSAGE,
  publicApi,
} from "../api/client";

// One successful request per URL for the app's lifetime: the tokens are single-use, and StrictMode
// (or a remount) runs the effect twice, so a second POST would answer "invalid token". A failed
// request is forgotten, so coming back to the link (or Retry) sends it again.
const requests = new Map();

/** @param {string} url */
function postOnce(url) {
  if (!requests.has(url)) {
    // The page shows the error itself, so no toast
    const request = publicApi.post(url, {}, { silentErrors: true });
    request.catch(() => {
      if (requests.get(url) === request) requests.delete(url);
    });
    requests.set(url, request);
  }
  return requests.get(url);
}

/** Forgets earlier requests (tests only). */
export function resetTokenActionRequests() {
  requests.clear();
}

/**
 * @typedef {object} TokenActionPageProps
 * @property {string} title e.g. "Email verification"
 * @property {(token: string) => string} url the endpoint that consumes the token from the route
 * @property {string} successMessage shown once the request succeeded
 */

/**
 * A page opened from an email link (`/<path>/:token`): posts the token once and announces the
 * result to screen readers.
 * @param {TokenActionPageProps} props
 */
export default function TokenActionPage({ title, url, successMessage }) {
  const { token } = useParams();
  const [state, setState] = useState(
    /** @type {{ status: "loading" | "done" | "error", message?: string, canRetry?: boolean }} */ ({
      status: "loading",
    })
  );
  const [attempt, setAttempt] = useState(0);
  const requestUrl = token ? url(token) : null;

  useEffect(() => {
    if (!requestUrl) {
      return undefined;
    }
    let isCurrent = true;
    setState({ status: "loading" });
    postOnce(requestUrl)
      .then(() => isCurrent && setState({ status: "done" }))
      .catch(
        (error) =>
          isCurrent &&
          setState({
            status: "error",
            message: error.response
              ? getErrorMessage(error)
              : NETWORK_ERROR_MESSAGE,
            // No answer (network, timeout) or a server fault: the token may still be good
            canRetry: !error.response || error.response.status >= 500,
          })
      );
    return () => {
      isCurrent = false;
    };
  }, [requestUrl, attempt]);

  const renderContent = () => {
    if (state.status === "loading") {
      return (
        <Center>
          <Loader aria-hidden />
          <Text ml="sm">Verifying…</Text>
        </Center>
      );
    }
    if (state.status === "error") {
      return (
        <Alert
          variant="light"
          color="red"
          title="This link didn't work"
          icon={<IconAlertCircle aria-hidden />}
        >
          {state.message}
          {state.canRetry && (
            <div>
              <Button
                mt="sm"
                size="xs"
                variant="light"
                color="red"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Retry
              </Button>
            </div>
          )}
        </Alert>
      );
    }
    return (
      <>
        <Center>
          <IconCheck size={96} color="teal" aria-hidden />
        </Center>
        <Text ta="center">{successMessage}</Text>
      </>
    );
  };

  return (
    <Container size={480} my={40}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Stack>
          <Title order={2} ta="center">
            {title}
          </Title>
          {/* Announces "Verifying…" and then the result */}
          <Stack role="status" aria-live="polite" gap="sm">
            {renderContent()}
          </Stack>
          {state.status !== "loading" && (
            <Button component={Link} to="/login" replace size="md">
              Go to login page
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
