import { useEffect, useState } from "react";
import {
  Button,
  Fieldset,
  FocusTrap,
  Select,
  TextInput,
  Title,
} from "@mantine/core";
import useAxios from "../../utils/useAxios";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import AmountInput from "../../components/AmountInput";
import showNotification from "../../components/showNotification";

export default function CreateAccount() {
  const callApi = useAxios();
  const navigate = useNavigate();
  let [isLoading, setIsLoading] = useState(true);
  let [accountTypes, setAccountTypes] = useState([]);
  let [currencies, setCurrencies] = useState([]);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      name: "",
      typeValue: "",
      balance: null,
      currencyValue: "",
    },

    validate: {
      name: (val) =>
        val.length > 50 || val.length < 3 || !/^[a-zA-Z0-9\s]+$/.test(val)
          ? "Name must be 3-50 characters and contain only letters, numbers and spaces"
          : null,
    },
  });

  useEffect(() => {
    callApi.get("account/create/enums").then((response) => {
      setAccountTypes(response.data?.accountTypes);
      setCurrencies(response.data?.currencies);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <>
      <Title order={2}>Create a New Account</Title>
      <Fieldset legend="Account information" mt="lg">
        <FocusTrap active={false}>
          <form
            onSubmit={form.onSubmit((e) => {
              setIsLoading(true);
              createAccount(e);
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
            />
            <AmountInput
              label="Balance"
              placeholder="Account Balance"
              required={true}
              form={form}
              fieldName="balance"
              mt="md"
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
            />
            <Button type="submit" loading={isLoading} fullWidth mt="xl">
              Create
            </Button>
          </form>
        </FocusTrap>
      </Fieldset>
    </>
  );
}
