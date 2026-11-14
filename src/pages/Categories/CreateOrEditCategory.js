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

export default function CreateOrEditCategory() {
  const { categoryId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = categoryId !== "create";

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      transactionTypeValue: "EXP",
      parentCategoryId: null,
    },

    validate: {
      name: validateEntityName,
    },
  });

  // Enums and (when editing) the category itself load in parallel; onSuccess fills the form
  const formQuery = useApiQuery(
    async (signal) => {
      const [enums, details] = await Promise.all([
        callApi.get("category/create/enums", { signal }).then((r) => r.data),
        isEdit
          ? callApi
              .post("category/search", { id: categoryId }, { signal })
              .then((r) => r.data?.content?.[0] ?? {})
          : null,
      ]);
      return { enums, details };
    },
    [categoryId],
    {
      onSuccess: ({ details }) => {
        if (details) {
          form.setValues({
            ...details,
            transactionTypeValue: details.transactionType?.value || "EXP",
            parentCategoryId: details.parentCategoryId
              ? details.parentCategoryId + ""
              : null,
          });
        }
      },
    }
  );
  const isLoading = formQuery.loading || isSaving;
  // A category that already has children can't get a parent itself (one nesting level)
  const isParentCategoryDisabled = Boolean(formQuery.data?.details?.isParent);
  const loadError = Boolean(formQuery.error);
  const transactionTypes = formQuery.data?.enums?.transactionTypes ?? [];
  // A category can't be its own parent, and its children can't become its parent
  const parentCategoryList = (
    formQuery.data?.enums?.parentCategoryList ?? []
  ).filter(
    (item) =>
      item?.value !== categoryId && item?.parentCategoryId + "" !== categoryId
  );

  // Only the fields the backend's request classes accept
  const toId = (value) => (value ? parseInt(value) : null);

  const createCategory = (values) => {
    callApi
      .post("category/create", {
        name: values.name,
        transactionTypeValue: values.transactionTypeValue,
        parentCategoryId: toId(values.parentCategoryId),
      })
      .then(() => {
        navigate("/categories", { replace: true });
        setIsSaving(false);
        showNotification("Category created successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const editCategory = (values) => {
    callApi
      .put(`category/update/${categoryId}`, {
        name: values.name,
        parentCategoryId: toId(values.parentCategoryId),
      })
      .then(() => {
        navigate("/categories", { replace: true });
        setIsSaving(false);
        showNotification("Category updated successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const deleteCategory = () => {
    setIsSaving(true);
    callApi
      .delete(`category/delete/${categoryId}`)
      .then(() => {
        navigate("/categories", { replace: true });
        setIsSaving(false);
        showNotification("Category deleted successfully", "success");
      })
      .catch(() => setIsSaving(false));
  };

  const openDeleteConfirmModal = () => {
    modals.openConfirmModal({
      title: "Delete this category?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this category? This action won't
          delete your transactions.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => {
        deleteCategory();
      },
    });
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Category" : "Create a New Category"}
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
          legend="Category information"
          disabled={isLoading || loadError}
        >
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsSaving(true);
                isEdit ? editCategory(e) : createCategory(e);
              })}
            >
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
                clearable={true}
                data={transactionTypes}
                onSelect={(value) => {
                  form.setFieldValue("parentCategoryId", null);
                }}
                {...form.getInputProps("transactionTypeValue")}
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
                data={parentCategoryList.filter(
                  (parentCategory) =>
                    parentCategory?.transactionType?.value ===
                    form.getValues()?.transactionTypeValue
                )}
                {...form.getInputProps("parentCategoryId")}
                searchable
                nothingFoundMessage="Nothing found..."
                mt="md"
                size="md"
                disabled={isParentCategoryDisabled}
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
                  Delete this category
                </Button>
              )}
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </Container>
  );
}
