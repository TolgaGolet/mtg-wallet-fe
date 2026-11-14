import PagedEntityList from "../../components/PagedEntityList";
import { LIMITS } from "../../validation/rules";

export default function Payees() {
  return (
    <PagedEntityList
      title="Payees"
      entity="payee"
      basePath="/payees"
      singularLabel="Payee"
      limit={LIMITS.payees}
      getSubtitle={(payee) => payee.categoryName}
    />
  );
}
