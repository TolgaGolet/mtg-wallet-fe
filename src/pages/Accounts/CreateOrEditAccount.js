import { useState } from "react";
import {
  Box,
  Button,
  Fieldset,
  FocusTrap,
  LoadingOverlay,
  Select,
  TextInput,
  Text,
  Container,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { useNavigate, useParams } from "react-router-dom";
import AmountInput from "../../components/AmountInput";
import showNotification from "../../components/showNotification";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import useApiQuery from "../../utils/useApiQuery";
import { validateEntityName } from "../../validation/rules";

export default function CreateOrEditAccount() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = accountId !== "create";

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      typeValue: "",
      balance: 0.0,
      currencyValue: "",
    },

    validate: {
      name: validateEntityName,
    },
  });

  // Enums and (when editing) the account itself load in parallel; onSuccess fills the form
  const formQuery = useApiQuery(
    async (signal) => {
      const [enums, details] = await Promise.all([
        callApi.get("account/create/enums", { signal }).then((r) => r.data),
        isEdit
          ? callApi
              .post("account/search", { id: accountId }, { signal })
              .then((r) => r.data?.content?.[0] ?? {})
          : null,
      ]);
      return { enums, details };
    },
    [accountId],
    {
      onSuccess: ({ details }) => {
        if (details) {
          form.setValues({
            ...details,
            typeValue: details.type?.value,
            currencyValue: details.currency?.value,
          });
        }
      },
    }
  );
  const isLoading = formQuery.loading || isSaving;
  const loadError = Boolean(formQuery.error);
  const accountTypes = formQuery.data?.enums?.accountTypes ?? [];
  const currencies = formQuery.data?.enums?.currencies ?? [];

  const createAccount = (request) => {
    callApi
      .post("account/create", request)
      .then(() => {
        navigate("/accounts", { replace: true });
        setIsSaving(false);
        showNotification("Account created successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const editAccount = (request) => {
    callApi
      .put(`account/update/${accountId}`, request)
      .then(() => {
        navigate(`/accounts/${accountId}`, { replace: true });
        setIsSaving(false);
        showNotification("Account updated successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const deleteAccount = () => {
    setIsSaving(true);
    callApi
      .delete(`account/delete/${accountId}`)
      .then(() => {
        navigate("/accounts", { replace: true });
        setIsSaving(false);
        showNotification("Account deleted successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const openDeleteConfirmModal = () => {
    modals.openConfirmModal({
      title: "Delete this account?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this account? This action won't delete
          your transactions.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => {
        deleteAccount();
      },
    });
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Account" : "Create a New Account"}
      />
      {loadError && (
        <LoadError
          mb="md"
          title="Couldn't load the form"
          onRetry={formQuery.retry}
        />
      )}
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset
          legend="Account information"
          disabled={isLoading || loadError}
        >
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsSaving(true);
                isEdit ? editAccount(e) : createAccount(e);
              })}
            >
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
              ></AmountInput>
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
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                mt="xl"
                size="md"
              >
                {isEdit ? "Save" : "Create"}
              </Button>
              {isEdit && (
                <Button
                  loading={isLoading}
                  fullWidth
                  mt="md"
                  size="md"
                  color="red"
                  onClick={openDeleteConfirmModal}
                >
                  Delete this account
                </Button>
              )}
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </Container>
  );
}
