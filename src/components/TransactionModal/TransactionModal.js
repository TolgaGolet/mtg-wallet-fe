import {
  Box,
  Button,
  Center,
  Fieldset,
  FocusTrap,
  Group,
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
import { modals } from "@mantine/modals";
import { IconCash, IconReceipt, IconTransfer } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import useStableCallback from "../../utils/useStableCallback";
import { trLocaleFilter } from "../../utils/trLocaleFilter";
import { accountOptionLabel } from "../../utils/format";
import AmountInput from "../AmountInput";
import LoadError from "../LoadError";
import showNotification from "../showNotification";
import SuggestionBadges from "./SuggestionBadges";
import usePayeeSearch from "./usePayeeSearch";
import { suggestedAccounts, suggestedPayees } from "./suggestions";
import {
  buildTransactionRequest,
  NEW_PAYEE_OPTION_ID,
} from "./transactionRequest";

const EMPTY_FORM = {
  payeeId: null,
  categoryId: null,
  amount: null,
  dateTime: null,
  sourceAccountId: null,
  targetAccountId: null,
  notes: null,
};

const idString = (id) => (id ? id + "" : null);

const focusField = (ref) => {
  setTimeout(() => ref?.current?.focus(), 50);
};

const toFormValues = (transaction) => ({
  ...transaction,
  dateTime: new Date(transaction.dateTime),
  categoryId: idString(transaction.payee?.category?.id),
  payeeId: idString(transaction.payee?.id),
  sourceAccountId: idString(transaction.sourceAccount?.id),
  targetAccountId: idString(transaction.targetAccount?.id),
});

const TYPE_OPTIONS = [
  { value: "EXP", label: "Expense", Icon: IconReceipt, color: "red" },
  { value: "INC", label: "Income", Icon: IconCash, color: "green" },
  { value: "TRA", label: "Transfer", Icon: IconTransfer, color: "blue" },
];

/**
 * Create/edit dialog for a transaction.
 * - `transactionId`: null to create, otherwise the transaction to edit (loaded by id).
 * - `loadedRecentTransactions`: optional list the parent already has, used for the quick-pick
 *   suggestions; without it the modal loads the latest transactions itself.
 * - `onSaved`: runs after a create, edit or delete, so the parent can refetch what it shows.
 */
export default function TransactionModal({
  opened,
  close,
  loadedRecentTransactions,
  transactionId,
  onSaved,
}) {
  const callApi = useAxios();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const isEdit = transactionId !== null && transactionId !== undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [typeValue, setTypeValue] = useState("EXP");
  const [initialTypeValue, setInitialTypeValue] = useState("EXP");
  const [categoryList, setCategoryList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isCategoryDisabled, setIsCategoryDisabled] = useState(false);
  const loadControllerRef = useRef(null);

  const payeeRef = useRef(null);
  const categoryRef = useRef(null);
  const amountRef = useRef(null);
  const accountRef = useRef(null);
  const targetAccountRef = useRef(null);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: { ...EMPTY_FORM, dateTime: new Date() },
    validate: {
      amount: (val) => (val < 0.01 ? "Amount must be greater than 0.01" : null),
      // Rules are read on every render, so typeValue is current
      targetAccountId: (val, values) => {
        if (typeValue !== "TRA") return null;
        if (!val) return "Target account is required";
        return val === values.sourceAccountId
          ? "Source and target account cannot be the same"
          : null;
      },
    },
  });

  // Typing an existing payee's name locks the category to that payee's category
  const { payeeList, isPayeeLoading, setKeyword, addPayee } = usePayeeSearch(
    typeValue,
    {
      enabled: opened,
      onKeywordChange: (keyword, exactMatch) => {
        if (exactMatch) {
          form.setFieldValue("categoryId", exactMatch.categoryId + "");
          setIsCategoryDisabled(true);
        } else {
          if (keyword) form.setFieldValue("categoryId", null);
          setIsCategoryDisabled(false);
        }
      },
    }
  );

  const resetState = () => {
    const values = { ...EMPTY_FORM, dateTime: new Date() };
    form.setValues(values);
    form.resetDirty(values);
    setTypeValue("EXP");
    setInitialTypeValue("EXP");
    setIsCategoryDisabled(false);
    setKeyword(null);
  };

  const fillForm = (transaction, loadedCategoryList, signal) => {
    const values = toFormValues(transaction);
    form.setValues(values);
    form.resetDirty(values);
    setTypeValue(transaction.type?.value);
    setInitialTypeValue(transaction.type?.value);
    addPayee(transaction.payee);
    // The payee's category may no longer be offered (e.g. inactive), so load it to show it
    const categoryId = transaction.payee?.category?.id;
    if (categoryId && !loadedCategoryList?.some((c) => c.id === categoryId)) {
      callApi
        .post(
          "category/search",
          { id: categoryId },
          { params: { pageNo: 0 }, signal }
        )
        .then((response) => {
          const category = response.data?.content?.[0];
          if (category) {
            setCategoryList((prev) =>
              prev.some((c) => c.id === category.id)
                ? prev
                : [...prev, category]
            );
          }
        })
        .catch(() => {}); // the API client has shown the error
    }
  };

  // Enums, suggestions and (in edit mode) the transaction itself load in parallel
  const loadModalData = () => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    const { signal } = controller;
    setIsLoading(true);
    setLoadError(false);

    const enums = callApi
      .get("transaction/create/enums", { signal })
      .then((response) => response.data);
    const recent = loadedRecentTransactions
      ? Promise.resolve(loadedRecentTransactions)
      : callApi
          .post("transaction/search", {}, { params: { pageNo: 0 }, signal })
          .then((response) => response.data?.content ?? []);
    const transaction = isEdit
      ? callApi
          .post(
            "transaction/search",
            { id: transactionId },
            { params: { pageNo: 0 }, signal }
          )
          .then((response) => response.data?.content?.[0] ?? null)
      : Promise.resolve(null);

    Promise.all([enums, recent, transaction])
      .then(([enumData, recentList, transactionData]) => {
        if (signal.aborted) return;
        setCategoryList(enumData?.categoryList ?? []);
        setAccountList(enumData?.accountList ?? []);
        setRecentTransactions(recentList);
        if (isEdit) {
          if (!transactionData) throw new Error("Transaction not found");
          fillForm(transactionData, enumData?.categoryList, signal);
        }
      })
      .catch(() => {
        if (!signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!signal.aborted) setIsLoading(false);
      });
  };

  const onOpenedChange = useStableCallback((isOpened) => {
    loadControllerRef.current?.abort();
    resetState();
    if (isOpened) {
      loadModalData();
    }
  });

  // Only re-runs when the modal opens or closes, never on state the load itself sets
  useEffect(() => {
    onOpenedChange(opened);
  }, [opened, onOpenedChange]);

  useEffect(() => () => loadControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!isLoading && !isEdit && opened) {
      focusField(payeeRef);
    }
  }, [isLoading, isEdit, opened]);

  const onSaveSuccess = (message) => {
    showNotification(message, "success");
    setIsLoading(false);
    close(); // not onClose: the changes are saved, so there's nothing to confirm
    onSaved?.();
  };

  const saveTransaction = (values) => {
    setIsLoading(true);
    const request = buildTransactionRequest(values, typeValue, payeeList);
    const call = isEdit
      ? callApi.put(`transaction/update/${transactionId}`, request)
      : callApi.post("transaction/create", request);
    call
      .then(() =>
        onSaveSuccess(isEdit ? "Transaction saved" : "Transaction created")
      )
      .catch(() => setIsLoading(false));
  };

  const deleteTransaction = () => {
    setIsLoading(true);
    callApi
      .delete(`transaction/delete/${transactionId}`)
      .then(() => onSaveSuccess("Transaction deleted"))
      .catch(() => setIsLoading(false));
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
      onConfirm: deleteTransaction,
    });
  };

  const onClose = () => {
    if (!form.isDirty() && typeValue === initialTypeValue) {
      close();
      return;
    }
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
      onConfirm: close,
    });
  };

  const onSelectSuggestedPayee = (payee) => {
    // The suggestion already holds the payee (id, name, category), so no request is needed
    addPayee(payee);
    form.setFieldValue("payeeId", payee.id + "");
    focusField(accountRef);
  };

  const onSelectSuggestedAccount = (account) => {
    form.setFieldValue("sourceAccountId", account.id + "");
    focusField(typeValue === "TRA" ? targetAccountRef : amountRef);
  };

  const createAccountLink = (text) => (
    <Box component="span" style={{ display: "block" }}>
      <Text size="sm" component="span" style={{ display: "block" }}>
        {text}
      </Text>
      <Button
        variant="subtle"
        size="compact-sm"
        component="a"
        href="/accounts/create-or-edit/create"
        onClick={(e) => {
          e.preventDefault();
          close();
          navigate("/accounts/create-or-edit/create");
        }}
      >
        Create a new account
      </Button>
    </Box>
  );

  const findAccount = (id) =>
    id ? accountList.find((account) => account.id + "" === id) : undefined;
  const sourceAccountId = form.getValues()?.sourceAccountId;
  const sourceCurrency = findAccount(sourceAccountId)?.currency?.value;
  const toAccountOption = (account) => ({
    value: account.id + "",
    label: accountOptionLabel(account),
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      title={
        <Box w="100%">
          <Text fw={500}>
            {isEdit ? "Edit Transaction" : "Create Transaction"}
          </Text>
          <Group justify="space-between" mt="xs">
            <Button variant="subtle" size="sm" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              form="transaction-form"
              loading={isLoading}
              disabled={loadError}
            >
              {isEdit ? "Save" : "Create"}
            </Button>
          </Group>
        </Box>
      }
      styles={{ title: { width: "100%" } }}
      centered
      transitionProps={{ transition: "fade", duration: 200 }}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <SegmentedControl
        value={typeValue}
        onChange={(value) => {
          // Payees and categories belong to one type, so the old choices don't carry over
          form.setValues((prev) => ({
            ...prev,
            payeeId: null,
            categoryId: null,
          }));
          setIsCategoryDisabled(false);
          setTypeValue(value);
          focusField(payeeRef);
        }}
        fullWidth
        disabled={isLoading}
        data={TYPE_OPTIONS.map(({ value, label, Icon, color }) => ({
          value,
          label: (
            <Center style={{ gap: 10 }}>
              <Icon
                aria-hidden
                style={{
                  width: rem(16),
                  height: rem(16),
                  color: theme.colors[color][6],
                }}
              />
              <span>{label}</span>
            </Center>
          ),
        }))}
      />
      {loadError && (
        <LoadError
          mt="md"
          title="Couldn't load the transaction form"
          onRetry={loadModalData}
        />
      )}
      <Box pos="relative" mt="md">
        <LoadingOverlay visible={isLoading} />
        <Fieldset disabled={isLoading || loadError}>
          <FocusTrap active={!isLoading && !isEdit}>
            <form
              id="transaction-form"
              onSubmit={form.onSubmit(saveTransaction)}
            >
              <Select
                ref={payeeRef}
                label="Payee"
                placeholder="Payee"
                description={
                  <>
                    <Text
                      size="sm"
                      component="span"
                      style={{ display: "block" }}
                    >
                      Type to search or add a new one
                    </Text>
                    <SuggestionBadges
                      items={suggestedPayees(recentTransactions, typeValue)}
                      ariaLabelPrefix="Use payee"
                      onSelect={onSelectSuggestedPayee}
                    />
                  </>
                }
                descriptionProps={{ component: "div" }}
                onSearchChange={setKeyword}
                rightSection={
                  isPayeeLoading ? <Loader size="sm" type="dots" /> : null
                }
                clearable={true}
                data={payeeList.map((payee) => ({
                  value: payee.id + "",
                  label: payee.name,
                }))}
                filter={trLocaleFilter}
                {...form.getInputProps("payeeId")}
                onChange={(value) => {
                  form.setFieldValue("payeeId", value);
                  if (value)
                    focusField(
                      value === NEW_PAYEE_OPTION_ID ? categoryRef : accountRef
                    );
                }}
                searchable
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              <Select
                ref={categoryRef}
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
                filter={trLocaleFilter}
                {...form.getInputProps("categoryId")}
                onChange={(value) => {
                  form.setFieldValue("categoryId", value);
                  if (value) focusField(accountRef);
                }}
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
              <Select
                ref={accountRef}
                label="Account"
                placeholder="Select Account"
                description={
                  <SuggestionBadges
                    items={suggestedAccounts(recentTransactions)}
                    ariaLabelPrefix="Use account"
                    onSelect={onSelectSuggestedAccount}
                  />
                }
                descriptionProps={{ component: "div" }}
                clearable={false}
                data={accountList.map(toAccountOption)}
                filter={trLocaleFilter}
                {...form.getInputProps("sourceAccountId")}
                onChange={(value) => {
                  form.setFieldValue("sourceAccountId", value);
                  // A target that is now the source, or in another currency, no longer qualifies
                  const target = findAccount(form.getValues().targetAccountId);
                  if (
                    target &&
                    (target.id + "" === value ||
                      target.currency?.value !==
                        findAccount(value)?.currency?.value)
                  ) {
                    form.setFieldValue("targetAccountId", null);
                  }
                  if (value)
                    focusField(
                      typeValue !== "TRA" ? amountRef : targetAccountRef
                    );
                }}
                searchable
                nothingFoundMessage={createAccountLink("Nothing found.")}
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              {typeValue === "TRA" && (
                <Select
                  ref={targetAccountRef}
                  label="Target Account"
                  placeholder="Select Target Account"
                  description="Target account's currency must match the source account's currency"
                  clearable={false}
                  data={accountList
                    .filter(
                      (account) =>
                        account.currency?.value === sourceCurrency &&
                        account.id + "" !== sourceAccountId
                    )
                    .map(toAccountOption)}
                  filter={trLocaleFilter}
                  {...form.getInputProps("targetAccountId")}
                  onChange={(value) => {
                    form.setFieldValue("targetAccountId", value);
                    if (value) focusField(amountRef);
                  }}
                  searchable
                  nothingFoundMessage={createAccountLink(
                    "No suitable account found of this type."
                  )}
                  required
                  disabled={isLoading}
                  mt="md"
                  size="md"
                />
              )}
              <AmountInput
                ref={amountRef}
                label="Amount"
                placeholder="Transaction Amount"
                required={true}
                form={form}
                fieldName="amount"
                min={0.01}
                mt="md"
                size="md"
                disabled={isLoading}
                rightSection={
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    color="gray"
                    px={rem(4)}
                    aria-label="Use the whole account balance"
                    onClick={() => {
                      const selectedAccount = findAccount(sourceAccountId);
                      if (selectedAccount) {
                        form.setFieldValue("amount", selectedAccount.balance);
                      }
                    }}
                  >
                    All
                  </Button>
                }
              ></AmountInput>
              <DateTimePicker
                label="Date and Time"
                placeholder="Transaction date and time"
                dropdownType="modal"
                highlightToday={true}
                {...form.getInputProps("dateTime")}
                onChange={(value) => form.setFieldValue("dateTime", value)}
                required
                disabled={isLoading}
                mt="md"
                size="md"
              />
              <TextInput
                label="Notes"
                placeholder="Add a note (optional)"
                maxLength={50}
                {...form.getInputProps("notes")}
                disabled={isLoading}
                mt="md"
                size="md"
              />
              {isEdit && (
                <Button
                  loading={isLoading}
                  fullWidth
                  mt="xl"
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
