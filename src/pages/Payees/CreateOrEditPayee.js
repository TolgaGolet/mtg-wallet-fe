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

export default function CreateOrEditPayee() {
  const { payeeId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [categoryList, setCategoryList] = useState([]);
  let isEdit = payeeId !== "create";
  let [payeeDetails, setPayeeDetails] = useState({});

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      categoryName: null,
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
    callApi.get("payee/create/enums").then((response) => {
      setCategoryList(response.data?.categoryList);
      if (isEdit) {
        callApi.post("payee/search", { id: payeeId }).then((response) => {
          setPayeeDetails(response.data?.content[0]);
          setIsLoading(false);
        });
      }
      !isEdit && setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let formValues = {
      ...payeeDetails,
      categoryName: payeeDetails?.categoryId + "",
    };
    form.setValues(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payeeDetails]);

  const createPayee = (request) => {
    request = {
      ...request,
      categoryId: request?.categoryName,
    };
    callApi
      .post("payee/create", request)
      .then((response) => {
        navigate("/payees", { replace: true });
        setIsLoading(false);
        showNotification("Payee created successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const editPayee = (request) => {
    request = {
      ...request,
      categoryId: request?.categoryName,
    };
    callApi
      .put(`payee/update/${payeeId}`, request)
      .then((response) => {
        navigate("/payees", { replace: true });
        setIsLoading(false);
        showNotification("Payee updated successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const deletePayee = () => {
    setIsLoading(true);
    callApi
      .delete(`payee/delete/${payeeId}`)
      .then((response) => {
        navigate("/payees", { replace: true });
        setIsLoading(false);
        showNotification("Payee deleted successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
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
    <>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Payee" : "Create a New Payee"}
      />
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset legend="Payee information" disabled={isLoading}>
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsLoading(true);
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
                data={categoryList}
                {...form.getInputProps("categoryName")}
                required
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
    </>
  );
}
