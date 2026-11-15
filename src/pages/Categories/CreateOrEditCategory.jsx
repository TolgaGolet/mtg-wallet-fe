import { Select, TextInput } from "@mantine/core";
import { useParams } from "react-router-dom";
import EntityFormPage from "../../components/entityForm/EntityFormPage";
import useEntityForm from "../../components/entityForm/useEntityForm";
import { validateEntityName } from "../../validation/rules";
import { TYPE } from "../../enum/TransactionType";
import { idString, toId } from "../../utils/ids";

export default function CreateOrEditCategory() {
  const { categoryId } = useParams();
  const entityForm = useEntityForm({
    entity: "category",
    id: categoryId,
    label: "Category",
    listPath: "/categories",
    initialValues: {
      name: "",
      transactionTypeValue: TYPE.EXPENSE,
      parentCategoryId: null,
    },
    validate: { name: validateEntityName },
    toFormValues: (category) => ({
      name: category.name ?? "",
      transactionTypeValue: category.transactionType?.value || TYPE.EXPENSE,
      parentCategoryId: idString(category.parentCategoryId),
    }),
    toCreateRequest: (values) => ({
      name: values.name,
      transactionTypeValue: values.transactionTypeValue,
      parentCategoryId: toId(values.parentCategoryId),
    }),
    // The transaction type can't be changed after creation
    toUpdateRequest: (values) => ({
      name: values.name,
      parentCategoryId: toId(values.parentCategoryId),
    }),
  });
  const { form, isEdit, enums, details } = entityForm;
  // A category that already has children can't get a parent itself (one nesting level)
  const isParentCategoryDisabled = Boolean(details?.isParent);
  const transactionTypes = enums?.transactionTypes ?? [];
  const selectedType = form.getValues().transactionTypeValue;
  // A category can't be its own parent, its children can't become its parent, and the parent
  // must have the same transaction type (the backend's validateParent rules)
  const parentCategoryList = (enums?.parentCategoryList ?? []).filter(
    (item) =>
      item?.value !== categoryId &&
      idString(item?.parentCategoryId) !== categoryId &&
      item?.transactionType?.value === selectedType
  );

  return (
    <EntityFormPage entityForm={entityForm}>
      <TextInput
        label="Name"
        placeholder="Category Name"
        {...form.getInputProps("name")}
        required
        size="md"
      />
      <Select
        label="Transaction Type"
        placeholder="Transaction Type"
        data={transactionTypes}
        {...form.getInputProps("transactionTypeValue")}
        // A parent of the old type no longer qualifies (the backend would reject it), so clear it
        onChange={(value) => {
          form.setFieldValue("transactionTypeValue", value);
          form.setFieldValue("parentCategoryId", null);
        }}
        allowDeselect={false}
        searchable
        nothingFoundMessage="Nothing found..."
        disabled={isEdit}
        required
        mt="md"
        size="md"
      />
      <Select
        label="Parent Category"
        placeholder="Parent Category"
        description={
          isParentCategoryDisabled
            ? "This category is already a parent category"
            : null
        }
        clearable={true}
        data={parentCategoryList}
        {...form.getInputProps("parentCategoryId")}
        searchable
        nothingFoundMessage="Nothing found..."
        mt="md"
        size="md"
        disabled={isParentCategoryDisabled}
      />
    </EntityFormPage>
  );
}
