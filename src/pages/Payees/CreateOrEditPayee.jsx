import { Select, TextInput } from "@mantine/core";
import { useParams } from "react-router-dom";
import EntityFormPage from "../../components/entityForm/EntityFormPage";
import useEntityForm from "../../components/entityForm/useEntityForm";
import { validateEntityName } from "../../validation/rules";
import { categoryLabel } from "../../utils/format";
import { idString, toId } from "../../utils/ids";

export default function CreateOrEditPayee() {
  const { payeeId } = useParams();
  const entityForm = useEntityForm({
    entity: "payee",
    id: payeeId,
    label: "Payee",
    listPath: "/payees",
    initialValues: { name: "", categoryId: null },
    validate: { name: validateEntityName },
    toFormValues: (payee) => ({
      name: payee.name ?? "",
      categoryId: idString(payee.categoryId),
    }),
    toCreateRequest: (values) => ({
      name: values.name,
      categoryId: toId(values.categoryId),
    }),
    // A payee's category can't be changed, so an update only sends the name
    toUpdateRequest: (values) => ({ name: values.name }),
  });
  const { form, isEdit, enums } = entityForm;
  const categoryList = enums?.categoryList ?? [];

  return (
    <EntityFormPage entityForm={entityForm}>
      <TextInput
        label="Name"
        placeholder="Payee Name"
        {...form.getInputProps("name")}
        required
        size="md"
      />
      <Select
        label="Category"
        placeholder="Category"
        clearable={true}
        data={categoryList.map((category) => ({
          value: idString(category.id),
          label: categoryLabel(category),
        }))}
        {...form.getInputProps("categoryId")}
        required
        disabled={isEdit}
        searchable
        nothingFoundMessage="Nothing found..."
        mt="md"
        size="md"
      />
    </EntityFormPage>
  );
}
