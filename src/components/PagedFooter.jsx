// @ts-check
import { Center, Pagination } from "@mantine/core";

/**
 * The pagination under a paged list (see usePagedSearch). Hidden when everything fits on one page.
 *
 * @param {object} props
 * @param {number} props.totalPages
 * @param {number} props.pageNo 0-based
 * @param {(pageNo: number) => void} props.onChange receives the 0-based page
 * @param {boolean} [props.disabled]
 */
export default function PagedFooter({
  totalPages,
  pageNo,
  onChange,
  disabled,
}) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <Center mb="lg" mt="md">
      <Pagination
        total={totalPages}
        value={pageNo + 1}
        onChange={(value) => {
          if (value !== pageNo + 1) {
            onChange(value - 1);
          }
        }}
        withEdges
        disabled={disabled}
      />
    </Center>
  );
}
