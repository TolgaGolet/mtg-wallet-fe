import {
  Badge,
  Box,
  Button,
  Center,
  Fieldset,
  FocusTrap,
  Loader,
  LoadingOverlay,
  Modal,
  rem,
  SegmentedControl,
  Select,
  Text,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconCash, IconReceipt, IconTransfer } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { modals } from "@mantine/modals";
import useAxios from "../../utils/useAxios";
import { useDebouncedValue } from "@mantine/hooks";
import AmountInput from "../../components/AmountInput";
import { useNavigate } from "react-router-dom";

export default function TransactionModal({
  opened,
  close,
  loadedRecentTransactions,
  transactionId,
}) {
  const callApi = useAxios();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  let [isLoading, setIsLoading] = useState(true);
  let [typeValue, setTypeValue] = useState("EXP");
  let [categoryList, setCategoryList] = useState([]);
  let [accountList, setAccountList] = useState([]);
  let [isCategoryDisabled, setIsCategoryDisabled] = useState(false);
  let [isPayeeLoading, setIsPayeeLoading] = useState(false);
  let [payeeList, setPayeeList] = useState([]);
  let [payeeSearchKeyword, setPayeeSearchKeyword] = useState(null);
  let [payeeSearchCache, setPayeeSearchCache] = useState({});
  let [recentTransactions, setRecentTransactions] = useState([]);
  const [debouncedPayeeSearchKeyword] = useDebouncedValue(
    payeeSearchKeyword,
    500
  );
  let isEdit = transactionId !== null;
  const newPayeePostFix = " (New)";
  const newPayeeId = "newPayee";

  const resetState = () => {
    form.reset();
    setTypeValue("EXP");
  };

  const openInEditMode = () => {
    let transactionData = recentTransactions.find(
      (transaction) => transaction.id === transactionId
    );
    if (transactionData) {
      let formValues = {
        ...transactionData,
        dateTime: new Date(transactionData.dateTime),
        payeeId: transactionData.payee?.id + "",
        sourceAccountId: transactionData.sourceAccount?.id + "",
        targetAccountId: transactionData.targetAccount?.id + "",
      };
      form.setValues(formValues);
      setTypeValue(transactionData.type?.value);
      if (transactionData.payee) {
        setPayeeList((prev) => {
          const payeeExists = prev.find(
            (payee) => payee.id === transactionData.payee.id
          );
          if (payeeExists) {
            return prev;
          }
          return [...prev, transactionData.payee];
        });
      }
    }
  };

  const getEnums = () => {
    setIsLoading(true);
    callApi.get("transaction/create/enums").then((response) => {
      setCategoryList(response.data?.categoryList?.content);
      setAccountList(response.data?.accountList?.content);
      isEdit && openInEditMode();
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (!opened) {
      resetState();
      return;
    }
    if (loadedRecentTransactions) {
      setRecentTransactions(loadedRecentTransactions);
      getEnums();
    } else if (!loadedRecentTransactions) {
      setIsLoading(true);
      callApi
        .post("transaction/search", {}, { params: { pageNo: 0 } })
        .then((response) => {
          setRecentTransactions(response.data?.content);
          getEnums();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, recentTransactions]);

  useEffect(() => {
    if (
      debouncedPayeeSearchKeyword === null ||
      debouncedPayeeSearchKeyword.includes(newPayeePostFix)
    ) {
      return;
    }
    let existingPayee = payeeList.find(
      (p) =>
        p.name?.trim().toLocaleLowerCase('tr-TR') ===
          debouncedPayeeSearchKeyword.trim().toLocaleLowerCase('tr-TR') &&
        p.id !== newPayeeId
    );
    if (existingPayee) {
      form.setFieldValue("categoryId", existingPayee.categoryId + "");
      setIsCategoryDisabled(true);
      return;
    } else {
      form.setFieldValue("categoryId", null);
      setIsCategoryDisabled(false);
    }
    let request = { transactionTypeValue: typeValue };
    if (
      debouncedPayeeSearchKeyword &&
      debouncedPayeeSearchKeyword?.length <= 50 &&
      /^[a-zA-Z0-9\sçğıöşüÇĞİÖŞÜ]+$/.test(debouncedPayeeSearchKeyword)
    ) {
      request = {
        ...request,
        name: debouncedPayeeSearchKeyword,
      };
    }
    let cacheData = payeeSearchCache[debouncedPayeeSearchKeyword + typeValue];
    if (cacheData) {
      processPayeeSearchResponse(request, cacheData);
      return;
    }
    setIsPayeeLoading(true);
    callApi
      .post("payee/search", request, { params: { pageNo: 0 } })
      .then((response) => {
        setPayeeSearchCache({
          ...payeeSearchCache,
          [debouncedPayeeSearchKeyword + typeValue]: response,
        });
        processPayeeSearchResponse(request, response);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPayeeSearchKeyword, typeValue]);

  const processPayeeSearchResponse = (request, response) => {
    addPayeeToContentIfNew(request, response);
    setPayeeList(response.data?.content);
    setIsPayeeLoading(false);
  };

  const addPayeeToContentIfNew = (request, response) => {
    if (
      request?.name &&
      (response.data?.empty ||
        !response.data?.content?.find(
          (p) =>
            p.name?.trim().toLocaleLowerCase('tr-TR') === request?.name?.trim().toLocaleLowerCase('tr-TR')
        ))
    ) {
      let newPayee = {
        name: debouncedPayeeSearchKeyword.trim() + newPayeePostFix,
        id: newPayeeId,
      };
      let content = response.data?.content.filter((p) => p.id !== newPayeeId);
      content.push(newPayee);
      response.data.content = content;
    }
  };

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      payeeId: null,
      categoryId: null,
      amount: null,
      dateTime: new Date(),
      sourceAccountId: null,
      targetAccountId: null,
      notes: null,
    },

    validate: {
      amount: (val) => (val < 0.01 ? "Amount must be greater than 0.01" : null),
      targetAccountId: (val) =>
        val === form?.getValues()?.sourceAccountId
          ? "Source and target account cannot be the same"
          : null,
    },
  });

  const createTransaction = (e) => {
    let request = {
      ...e,
      typeValue: typeValue,
      categoryId: parseInt(e.categoryId),
      payeeId: e.payeeId === newPayeeId ? -1 : parseInt(e.payeeId),
      payeeName: payeeList
        .find((p) => p.id + "" === e.payeeId)
        ?.name?.replace(newPayeePostFix, ""),
      sourceAccountId: parseInt(e.sourceAccountId),
      targetAccountId: parseInt(e.targetAccountId),
    };
    callApi
      .post("transaction/create", request)
      .then((response) => {
        window.location.reload();
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const editTransaction = (e) => {
    let request = {
      ...e,
      typeValue: typeValue,
      categoryId: parseInt(e.categoryId),
      payeeId: e.payeeId === newPayeeId ? -1 : parseInt(e.payeeId),
      payeeName: payeeList
        .find((p) => p.id + "" === e.payeeId)
        ?.name?.replace(newPayeePostFix, ""),
      sourceAccountId: parseInt(e.sourceAccountId),
      targetAccountId: typeValue === "TRA" ? parseInt(e.targetAccountId) : null,
    };
    callApi
      .put(`transaction/update/${transactionId}`, request)
      .then((response) => {
        window.location.reload();
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const deleteTransaction = () => {
    setIsLoading(true);
    callApi
      .delete(`transaction/delete/${transactionId}`)
      .then((response) => {
        setIsLoading(false);
        window.location.reload();
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  };

  const openDeleteConfirmModal = () => {
    modals.openConfirmModal({
      title: "Delete this transaction?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this transaction? This action will
          revert this transaction.
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => {
        deleteTransaction();
      },
    });
  };

  const getUniqueRecentTransactionsArray = () => {
    const uniqueRecentTransactions = recentTransactions.reduce(
      (acc, transaction) => {
        const existingTransaction = acc.find(
          (t) =>
            t.payee?.name?.trim().toLocaleLowerCase('tr-TR') ===
            transaction.payee?.name?.trim().toLocaleLowerCase('tr-TR')
        );
        if (!existingTransaction) {
          acc.push(transaction);
        }
        return acc;
      },
      []
    );
    return Array.from(uniqueRecentTransactions);
  };

  const onClickSuggestedAccount = (accountId) => {
    form.setFieldValue("sourceAccountId", accountId + "");
  };

  const onClickSuggestedPayee = (payeeId) => {
    if (!payeeList.find((p) => p.id + "" === payeeId + "")) {
      let request = { id: payeeId };
      setIsPayeeLoading(true);
      callApi
        .post("payee/search", request, { params: { pageNo: 0 } })
        .then((response) => {
          processPayeeSearchResponse(request, response);
        });
    }
    form.setFieldValue("payeeId", payeeId + "");
  };

  const renderSuggestedAccounts = () => {
    const uniqueAccounts = new Set();
    return getUniqueRecentTransactionsArray()
      .filter((transaction) => {
        const accountId = transaction.sourceAccount?.id;
        if (accountId && !uniqueAccounts.has(accountId)) {
          uniqueAccounts.add(accountId);
          return true;
        }
        return false;
      })
      .slice(0, 2)
      .map((transaction) => (
        <Badge
          key={transaction.id}
          variant="light"
          mt="xs"
          mr={rem(5)}
          onClick={() => onClickSuggestedAccount(transaction.sourceAccount?.id)}
          style={{ cursor: "pointer" }}
        >
          {transaction.sourceAccount?.name}
        </Badge>
      ));
  };

  const renderSuggestedPayees = () => {
    return getUniqueRecentTransactionsArray()
      .filter((transaction) => transaction.type?.value === typeValue)
      .slice(0, 5)
      .map((transaction) => (
        <Badge
          key={transaction.id}
          variant="light"
          mt="xs"
          mr={rem(5)}
          onClick={() => onClickSuggestedPayee(transaction.payee?.id)}
          style={{ cursor: "pointer" }}
        >
          {transaction.payee?.name}
        </Badge>
      ));
  };

  const onClose = () => {
    modals.openConfirmModal({
      title: "Unsaved Changes",
      centered: true,
      children: (
        <Text size="sm">
          Any unsaved changes will be lost. Are you sure you want to close this
          form?
        </Text>
      ),
      labels: { confirm: "Yes", cancel: "No" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => {
        close();
      },
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit Transaction" : "Create Transaction"}
      centered
      transitionProps={{ transition: "fade", duration: 200 }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <SegmentedControl
        value={typeValue}
        onChange={(value) => {
          form.setValues((prev) => ({ ...prev, payeeId: null }));
          setTypeValue(value);
        }}
        fullWidth
        disabled={isLoading}
        data={[
          {
            label: (
              <Center style={{ gap: 10 }}>
                <IconReceipt
                  style={{
                    width: rem(16),
                    height: rem(16),
                    color: theme.colors.red[6],
                  }}
                />
                <span>Expense</span>
              </Center>
            ),
            value: "EXP",
          },
          {
            label: (
              <Center style={{ gap: 10 }}>
                <IconCash
                  style={{
                    width: rem(16),
                    height: rem(16),
                    color: theme.colors.green[6],
                  }}
                />
                <span>Income</span>
              </Center>
            ),
            value: "INC",
          },
          {
            label: (
              <Center style={{ gap: 10 }}>
                <IconTransfer
                  style={{
                    width: rem(16),
                    height: rem(16),
                    color: theme.colors.blue[6],
                  }}
                />
                <span>Transfer</span>
              </Center>
            ),
            value: "TRA",
          },
        ]}
      />
      <Box pos="relative" mt="md">
        <LoadingOverlay visible={isLoading} />
        <Fieldset disabled={isLoading}>
          <FocusTrap active={true}>
            <form
              onSubmit={form.onSubmit((e) => {
                setIsLoading(true);
                isEdit ? editTransaction(e) : createTransaction(e);
              })}
            >
              <Select
                label="Payee"
                placeholder="Payee"
                description="Type to search or add a new one"
                onSearchChange={setPayeeSearchKeyword}
                rightSection={
                  isPayeeLoading ? <Loader size="sm" type="dots" /> : null
                }
                clearable={true}
                data={payeeList.map((payee) => ({
                  value: payee.id + "",
                  label: payee.name,
                }))}
                filter={({ options, search }) =>
                  options.filter((option) =>
                    option.label
                      .toLocaleLowerCase("tr-TR")
                      .includes(search.toLocaleLowerCase("tr-TR"))
                  )
                }
                {...form.getInputProps("payeeId")}
                searchable
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              {renderSuggestedPayees()}
              <Select
                label="Category"
                placeholder="Category"
                clearable={true}
                data={categoryList
                  .filter(
                    (category) => category.transactionType.value === typeValue
                  )
                  .map((category) => ({
                    value: category.id + "",
                    label: category.parentCategoryName
                      ? category.name + " (" + category.parentCategoryName + ")"
                      : category.name,
                  }))}
                filter={({ options, search }) =>
                  options.filter((option) =>
                    option.label
                      .toLocaleLowerCase("tr-TR")
                      .includes(search.toLocaleLowerCase("tr-TR"))
                  )
                }
                {...form.getInputProps("categoryId")}
                searchable
                nothingFoundMessage={
                  "Nothing found. Add a new " +
                  typeValue +
                  " category from categories page."
                }
                required
                disabled={isLoading || isCategoryDisabled}
                mt="md"
                size="md"
              />
              <AmountInput
                label="Amount"
                placeholder="Transaction Amount"
                required={true}
                form={form}
                fieldName="amount"
                min={0.01}
                mt="md"
                size="md"
                disabled={isLoading}
              ></AmountInput>
              <DateTimePicker
                label="Date and Time"
                placeholder="Transaction date and time"
                dropdownType="modal"
                highlightToday={true}
                {...form.getInputProps("dateTime")}
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              <Select
                label="Account"
                placeholder="Select Account"
                clearable={false}
                data={accountList.map((account) => ({
                  value: account.id + "",
                  label:
                    account.name +
                    " (" +
                    account.balance +
                    account.currency?.value +
                    ")",
                }))}
                filter={({ options, search }) =>
                  options.filter((option) =>
                    option.label
                      .toLocaleLowerCase("tr-TR")
                      .includes(search.toLocaleLowerCase("tr-TR"))
                  )
                }
                {...form.getInputProps("sourceAccountId")}
                searchable
                nothingFoundMessage={
                  <Box>
                    <Text size="sm">Nothing found.</Text>
                    <Button
                      variant="subtle"
                      compact
                      component="a"
                      href="/accounts/create"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href =
                          "/accounts/create-or-edit/create";
                      }}
                    >
                      Create a new account
                    </Button>
                  </Box>
                }
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              {renderSuggestedAccounts()}
              {typeValue === "TRA" && (
                <Select
                  label="Target Account"
                  placeholder="Select Target Account"
                  description="Target account's currency must match the source account's currency"
                  clearable={false}
                  data={accountList
                    .filter(
                      (account) =>
                        account.currency?.value ===
                          accountList.find(
                            (account2) =>
                              account2.id + "" ===
                              form?.getValues()?.sourceAccountId
                          )?.currency?.value &&
                        account.id + "" !== form?.getValues()?.sourceAccountId
                    )
                    .map((account) => ({
                      value: account.id + "",
                      label:
                        account.name +
                        " (" +
                        account.balance +
                        account.currency?.value +
                        ")",
                    }))}
                  filter={({ options, search }) =>
                    options.filter((option) =>
                      option.label
                        .toLocaleLowerCase("tr-TR")
                        .includes(search.toLocaleLowerCase("tr-TR"))
                    )
                  }
                  {...form.getInputProps("targetAccountId")}
                  searchable
                  nothingFoundMessage={
                    <Box>
                      <Text size="sm">
                        No suitable account found of this type.
                      </Text>
                      <Button
                        variant="subtle"
                        compact
                        component="a"
                        href="/accounts/create"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/accounts/create-or-edit/create", {
                            replace: false,
                          });
                        }}
                      >
                        Create a new account
                      </Button>
                    </Box>
                  }
                  required={typeValue === "TRA"}
                  disabled={isLoading || typeValue !== "TRA"}
                  mt="md"
                  size="md"
                />
              )}
              <TextInput
                label="Notes"
                placeholder="Add a note (optional)"
                maxLength={50}
                {...form.getInputProps("notes")}
                disabled={isLoading}
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
                  Delete this transaction
                </Button>
              )}
            </form>
          </FocusTrap>
        </Fieldset>
      </Box>
    </Modal>
  );
}
