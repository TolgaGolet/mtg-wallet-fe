import { useState, useEffect } from "react";
import {
  Container,
  Box,
  LoadingOverlay,
  Fieldset,
  FocusTrap,
  Button,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import useAxios from "../../utils/useAxios";
import PageTitle from "../../components/PageTitle";

export default function Settings() {
  // TODO this page
  const callApi = useAxios();
  let [isLoading, setIsLoading] = useState(true);
  let [accountList, setAccountList] = useState([]);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      defaultAccountId: null,
    },
    validate: {},
  });

  useEffect(() => {
    callApi.post("account/search", {}).then((response) => {
      setAccountList(response.data?.content);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = (values) => {
    // setIsLoading(true);
    // callApi
    //   .post("settings/update", values)
    //   .then(() => {
    //     showNotification("Settings updated successfully", "success");
    //   })
    //   .catch(() => {
    //     setIsLoading(false);
    //   });
  };

  return (
    <Container size="lg" px={0}>
      <PageTitle isBackButtonVisible={true} value="Settings" />
      <Box pos="relative">
        <LoadingOverlay visible={isLoading} />
        <Fieldset legend="Application Settings" disabled={isLoading}>
          <FocusTrap active={false}>
            <form onSubmit={form.onSubmit((values) => saveSettings(values))}>
              <Select
                label="Default Account"
                placeholder="Select default account"
                clearable={true}
                data={accountList.map((account) => ({
                  value: account.id + "",
                  label: account.name,
                }))}
                {...form.getInputProps("defaultAccountId")}
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
                /* TODO disabled={isLoading} */
                disabled={true}
              >
                Save Changes
              </Button>
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </Container>
  );
}
