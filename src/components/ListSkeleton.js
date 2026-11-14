import { Skeleton, Stack } from "@mantine/core";

/** Placeholder rows shown while a list loads. */
export default function ListSkeleton({ count = 6, height = 100, gap = 10 }) {
  return (
    <Stack gap={gap} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </Stack>
  );
}
