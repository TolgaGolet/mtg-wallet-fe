import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Fieldset,
  FocusTrap,
  LoadingOverlay,
  Select,
  TextInput,
  Text,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { useNavigate, useParams } from "react-router-dom";
import showNotification from "../../components/showNotification";
import PageTitle from "../../components/PageTitle";

export default function CreateOrEditCategory() {
  const { categoryId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [transactionTypes, setTransactionTypes] = useState([]);
  let [parentCategoryList, setParentCategoryList] = useState([]);
  let isEdit = categoryId !== "create";
  let [categoryDetails, setCategoryDetails] = useState({});
  let [isParentCategoryDisabled, setIsParentCategoryDisabled] = useState(false);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      transactionTypeValue: "EXP",
      parentCategoryName: null,
    },

    validate: {
      name: (val) =>
        val?.length > 50 ||
        val?.length < 3 ||
        !/^[a-zA-Z0-9\sçğıöşü]+$/.test(val)
          ? "Name must be 3-50 characters and contain only letters, numbers and spaces"
          : null,
    },
  });

  useEffect(() => {
    callApi.get("category/create/enums").then((response) => {
      setTransactionTypes(response.data?.transactionTypes);
      setParentCategoryList(
        response.data?.parentCategoryList?.filter((item) => {
          return (
            item?.value !== categoryId &&
            item?.parentCategoryId + "" !== categoryId
          );
        })
      );
      if (isEdit) {
        callApi.post("category/search", { id: categoryId }).then((response) => {
          setCategoryDetails(response.data?.content[0]);
          setIsLoading(false);
        });
      }
      !isEdit && setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let formValues = {
      ...categoryDetails,
      transactionTypeValue: categoryDetails?.transactionType?.value || "EXP",
      parentCategoryName: categoryDetails?.parentCategoryId
        ? categoryDetails?.parentCategoryId + ""
        : null,
    };
    form.setValues(formValues);
    setIsParentCategoryDisabled(categoryDetails?.parent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryDetails]);

  const createCategory = (request) => {
    request = {
      ...request,
      parentCategoryId: request?.parentCategoryName,
      parentCategoryName: null,
    };
    callApi
      .post("category/create", request)
      .then((response) => {
        navigate("/categories", { replace: true });
        setIsLoading(false);
        showNotification("Category created successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const editCategory = (request) => {
    request = {
      ...request,
      parentCategoryId: request?.parentCategoryName,
      parentCategoryName: null,
    };
    callApi
      .put(`category/update/${categoryId}`, request)
      .then((response) => {
        navigate("/categories", { replace: true });
        setIsLoading(false);
        showNotification("Category updated successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const deleteCategory = () => {
    setIsLoading(true);
    callApi
      .delete(`category/delete/${categoryId}`)
      .then((response) => {
        navigate("/categories", { replace: true });
        setIsLoading(false);
        showNotification("Category deleted successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
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
    <>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Category" : "Create a New Category"}
      />
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset legend="Category information" disabled={isLoading}>
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsLoading(true);
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
                  form.setFieldValue("parentCategoryName", null);
                }}
                {...form.getInputProps("transactionTypeValue")}
                searchable
                nothingFoundMessage="Nothing found..."
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
                {...form.getInputProps("parentCategoryName")}
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
    </>
  );
}
