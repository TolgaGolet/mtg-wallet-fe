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
import AmountInput from "../../components/AmountInput";
import showNotification from "../../components/showNotification";
import PageTitle from "../../components/PageTitle";

export default function CreateOrEditAccount() {
  const { accountId } = useParams();
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [accountTypes, setAccountTypes] = useState([]);
  let [currencies, setCurrencies] = useState([]);
  let isEdit = accountId !== "create";
  let [accountDetails, setAccountDetails] = useState({});

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      typeValue: "",
      balance: 0.0,
      currencyValue: "",
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
    callApi.get("account/create/enums").then((response) => {
      setAccountTypes(response.data?.accountTypes);
      setCurrencies(response.data?.currencies);
      if (isEdit) {
        callApi.post("account/search", { id: accountId }).then((response) => {
          setAccountDetails(response.data?.content[0]);
          setIsLoading(false);
        });
      }
      !isEdit && setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let formValues = {
      ...accountDetails,
      typeValue: accountDetails?.type?.value,
      currencyValue: accountDetails?.currency?.value,
    };
    form.setValues(formValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountDetails]);

  const createAccount = (request) => {
    callApi
      .post("account/create", request)
      .then((response) => {
        navigate("/accounts", { replace: true });
        setIsLoading(false);
        showNotification("Account created successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const editAccount = (request) => {
    callApi
      .put(`account/update/${accountId}`, request)
      .then((response) => {
        navigate(`/accounts/${accountId}`, { replace: true });
        setIsLoading(false);
        showNotification("Account updated successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const deleteAccount = () => {
    setIsLoading(true);
    callApi
      .delete(`account/delete/${accountId}`)
      .then((response) => {
        navigate("/accounts", { replace: true });
        setIsLoading(false);
        showNotification("Account deleted successfully", "success");
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
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

  const onClickDeleteAccount = () => {
    openDeleteConfirmModal();
  };

  return (
    <>
      <PageTitle
        isBackButtonVisible={true}
        value={isEdit ? "Edit Account" : "Create a New Account"}
      />
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset legend="Account information" disabled={isLoading}>
          <FocusTrap active={false}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsLoading(true);
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
                  onClick={onClickDeleteAccount}
                >
                  Delete this account
                </Button>
              )}
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </>
  );
}
