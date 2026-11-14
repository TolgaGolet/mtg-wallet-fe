import { Button, Container, Group, Text, Title } from "@mantine/core";
import { useRouteError } from "react-router-dom";

// A lazy page whose file no longer exists (the app was redeployed while this tab was open)
const isChunkLoadError = (error) =>
  error?.name === "ChunkLoadError" ||
  /Loading( CSS)? chunk [\w-]+ failed/i.test(error?.message ?? "");

/**
 * Shown by the router when a page throws while rendering or fails to load. It replaces the whole
 * layout, so it only uses Mantine (no auth context).
 */
export default function RouteError() {
  const error = useRouteError();
  const isNewVersion = isChunkLoadError(error);

  return (
    <Container size="sm" py={80}>
      <Title order={1} ta="center">
        {isNewVersion ? "A new version is available" : "Something went wrong"}
      </Title>
      <Text c="dimmed" size="lg" ta="center" mt="md">
        {isNewVersion
          ? "The app was updated since you opened this page. Reload to get the latest version."
          : "This page ran into an unexpected error. Reloading usually fixes it; if it keeps happening, contact support."}
      </Text>
      <Group justify="center" mt="xl">
        <Button size="md" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button size="md" variant="default" component="a" href="/">
          Go to the home page
        </Button>
      </Group>
    </Container>
  );
}
