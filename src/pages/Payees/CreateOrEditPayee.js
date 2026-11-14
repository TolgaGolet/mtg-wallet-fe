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
import showNotification from "../../components/showNotification";
import PageTitle from "../../components/PageTitle";
import LoadError from "../../components/LoadError";
import useApiQuery from "../../utils/useApiQuery";
import { validateEntityName } from "../../validation/rules";

export default function CreateOrEditPayee() {
  const { payeeId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = payeeId !== "create";

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      categoryId: null,
    },

    validate: {
      name: validateEntityName,
    },
  });

  // Enums and (when editing) the payee itself load in parallel; onSuccess fills the form
  const formQuery = useApiQuery(
    async (signal) => {
      const [enums, details] = await Promise.all([
        callApi.get("payee/create/enums", { signal }).then((r) => r.data),
        isEdit
          ? callApi
              .post("payee/search", { id: payeeId }, { signal })
              .then((r) => r.data?.content?.[0] ?? {})
          : null,
      ]);
      return { enums, details };
    },
    [payeeId],
    {
      onSuccess: ({ details }) => {
        if (details) {
          form.setValues({
            ...details,
            categoryId: details.categoryId ? details.categoryId + "" : null,
          });
        }
      },
    }
  );
  const isLoading = formQuery.loading || isSaving;
  const loadError = Boolean(formQuery.error);
  const categoryList = formQuery.data?.enums?.categoryList ?? [];

  // Only the fields the backend's request classes accept
  const createPayee = (values) => {
    callApi
      .post("payee/create", {
        name: values.name,
        categoryId: values.categoryId ? parseInt(values.categoryId) : null,
      })
      .then(() => {
        navigate("/payees", { replace: true });
        setIsSaving(false);
        showNotification("Payee created successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  // A payee's category can't be changed, so an update only sends the name
  const editPayee = (values) => {
    callApi
      .put(`payee/update/${payeeId}`, { name: values.name })
      .then(() => {
        navigate("/payees", { replace: true });
        setIsSaving(false);
        showNotification("Payee updated successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const deletePayee = () => {
    setIsSaving(true);
    callApi
      .delete(`payee/delete/${payeeId}`)
      .then(() => {
        navigate("/payees", { replace: true });
        setIsSaving(false);
        showNotification("Payee deleted successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const openDeleteConfirmModal = () => {
    modals.openConfirmModal({
      title: "Delete this payee?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this payee? This action won't delete
          your transactions.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => {
        deletePayee();
      },
    });
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Payee" : "Create a New Payee"}
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
        <Fieldset legend="Payee information" disabled={isLoading || loadError}>
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsSaving(true);
                isEdit ? editPayee(e) : createPayee(e);
              })}
            >
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
                  value: category.id + "",
                  label: category.parentCategoryName
                    ? category.name + " (" + category.parentCategoryName + ")"
                    : category.name,
                }))}
                {...form.getInputProps("categoryId")}
                required
                disabled={isEdit}
                searchable
                nothingFoundMessage="Nothing found..."
                mt="md"
                size="md"
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
                  Delete this payee
                </Button>
              )}
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </Container>
  );
}
