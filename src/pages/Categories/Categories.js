import PagedEntityList from "../../components/PagedEntityList";
import { LIMITS } from "../../validation/rules";

export default function Categories() {
  return (
    <PagedEntityList
      title="Categories"
      entity="category"
      basePath="/categories"
      singularLabel="Category"
      limit={LIMITS.categories}
      getSubtitle={(category) => category.parentCategoryName}
    />
  );
}
