import { Select, TextInput } from "@mantine/core";
import { useParams } from "react-router-dom";
import AmountInput from "../../components/AmountInput";
import EntityFormPage from "../../components/entityForm/EntityFormPage";
import useEntityForm from "../../components/entityForm/useEntityForm";
import { validateEntityName } from "../../validation/rules";

export default function CreateOrEditAccount() {
  const { accountId } = useParams();
  const entityForm = useEntityForm({
    entity: "account",
    id: accountId,
    label: "Account",
    listPath: "/accounts",
    afterUpdatePath: `/accounts/${accountId}`,
    initialValues: { name: "", typeValue: "", balance: 0, currencyValue: "" },
    validate: { name: validateEntityName },
    toFormValues: (account) => ({
      name: account.name ?? "",
      typeValue: account.type?.value ?? "",
      balance: account.balance ?? 0,
      currencyValue: account.currency?.value ?? "",
    }),
    // Only the fields AccountCreateRequest / AccountUpdateRequest accept; the balance and the
    // currency can't be changed after creation
    toCreateRequest: ({ name, typeValue, balance, currencyValue }) => ({
      name,
      typeValue,
      balance,
      currencyValue,
    }),
    toUpdateRequest: ({ name, typeValue }) => ({ name, typeValue }),
  });
  const { form, isEdit, enums } = entityForm;
  const accountTypes = enums?.accountTypes ?? [];
  const currencies = enums?.currencies ?? [];

  return (
    <EntityFormPage entityForm={entityForm}>
      <TextInput
        label="Name"
        placeholder="Account Name"
        {...form.getInputProps("name")}
        required
        size="md"
      />
      <Select
        label="Type"
        placeholder="Account Type"
        clearable={true}
        data={accountTypes}
        {...form.getInputProps("typeValue")}
        searchable
        nothingFoundMessage="Nothing found..."
        required
        mt="md"
        size="md"
      />
      <AmountInput
        label="Balance"
        placeholder="Account Balance"
        required={true}
        form={form}
        fieldName="balance"
        mt="md"
        size="md"
        disabled={isEdit}
      />
      <Select
        label="Currency"
        placeholder="Account Currency"
        clearable={true}
        data={currencies.map((currency) => ({
          value: currency.value,
          label: currency.value + " - " + currency.label,
        }))}
        {...form.getInputProps("currencyValue")}
        searchable
        nothingFoundMessage="Nothing found..."
        required
        mt="md"
        size="md"
        disabled={isEdit}
      />
    </EntityFormPage>
  );
}
