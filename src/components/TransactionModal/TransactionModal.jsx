import {
  Box,
  Button,
  Fieldset,
  FocusTrap,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  rem,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import { trLocaleFilter } from "../../utils/trLocaleFilter";
import { accountOptionLabel, categoryLabel } from "../../utils/format";
import { idString } from "../../utils/ids";
import { TYPE, TYPE_LABEL } from "../../enum/TransactionType";
import { isNotFound } from "../../api/fetchById";
import AmountInput from "../AmountInput";
import LoadError from "../LoadError";
import { notFoundMessage } from "../NotFoundState";
import showNotification from "../showNotification";
import openDeleteConfirm from "../openDeleteConfirm";
import SuggestionBadges from "./SuggestionBadges";
import TransactionTypeControl from "./TransactionTypeControl";
import usePayeeSearch from "./usePayeeSearch";
import useTransactionFormData from "./useTransactionFormData";
import { findAccount, targetOptions } from "./accountRules";
import { suggestedAccounts, suggestedPayees } from "./suggestions";
import {
  buildTransactionRequest,
  NEW_PAYEE_OPTION_ID,
} from "./transactionRequest";
import { validateAmountMax } from "../../validation/rules";

const focusField = (ref) => {
  setTimeout(() => ref?.current?.focus(), 50);
};

const toFormValues = (transaction) => ({
  payeeId: idString(transaction.payee?.id),
  categoryId: idString(transaction.payee?.category?.id),
  amount: transaction.amount,
  dateTime: new Date(transaction.dateTime),
  sourceAccountId: idString(transaction.sourceAccount?.id),
  targetAccountId: idString(transaction.targetAccount?.id),
  notes: transaction.notes ?? "",
});

/**
 * Create/edit dialog for a transaction. Parents mount it only while it is open (and load it
 * lazily), so every opening starts from a fresh form.
 * - `transactionId`: null to create, otherwise the transaction to edit (loaded by id).
 * - `loadedRecentTransactions`: optional list the parent already has, used for the quick-pick
 *   suggestions; without it the modal loads the latest transactions itself.
 * - `close()`: closes the dialog (the parent unmounts it).
 * - `onSaved`: runs after a create, edit or delete, so the parent can refetch what it shows.
 *
 * @param {{ close: () => void, transactionId?: number | null,
 *   loadedRecentTransactions?: any[] | null, onSaved?: () => void }} props
 */
export default function TransactionModal({
  close,
  loadedRecentTransactions,
  transactionId,
  onSaved,
}) {
  const callApi = useAxios();
  const navigate = useNavigate();
  const isEdit = transactionId !== null && transactionId !== undefined;
  const [isSaving, setIsSaving] = useState(false);
  const [typeValue, setTypeValue] = useState(TYPE.EXPENSE);
  const [isCategoryDisabled, setIsCategoryDisabled] = useState(false);

  const payeeRef = useRef(null);
  const categoryRef = useRef(null);
  const amountRef = useRef(null);
  const accountRef = useRef(null);
  const targetAccountRef = useRef(null);

  const form = useForm({
    validateInputOnBlur: true,
    initialValues: {
      payeeId: null,
      categoryId: null,
      amount: null,
      dateTime: new Date(),
      sourceAccountId: null,
      targetAccountId: null,
      notes: "",
    },
    validate: {
      amount: (val) =>
        val < 0.01
          ? "Amount must be greater than 0.01"
          : validateAmountMax(val),
      // Rules are read on every render, so typeValue is current
      targetAccountId: (val, values) => {
        if (typeValue !== TYPE.TRANSFER) return null;
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
      onKeywordChange: (keyword, exactMatch) => {
        if (exactMatch) {
          form.setFieldValue("categoryId", idString(exactMatch.categoryId));
          setIsCategoryDisabled(true);
        } else {
          if (keyword) form.setFieldValue("categoryId", null);
          setIsCategoryDisabled(false);
        }
      },
    }
  );

  const dataQuery = useTransactionFormData(
    transactionId,
    loadedRecentTransactions,
    ({ transaction }) => {
      if (!transaction) return;
      const values = toFormValues(transaction);
      form.setValues(values);
      form.resetDirty(values);
      setTypeValue(transaction.type?.value);
      addPayee(transaction.payee);
    }
  );
  const categoryList = dataQuery.data?.categoryList ?? [];
  const accountList = dataQuery.data?.accountList ?? [];
  const recentTransactions = dataQuery.data?.recentTransactions ?? [];
  // What the type was when the form loaded: changing it counts as an unsaved change
  const initialTypeValue =
    dataQuery.data?.transaction?.type?.value ?? TYPE.EXPENSE;
  const loadError = Boolean(dataQuery.error);
  const notFound = isNotFound(dataQuery.error);
  const isLoading = dataQuery.loading || isSaving;

  useEffect(() => {
    if (!dataQuery.loading && !isEdit) {
      focusField(payeeRef);
    }
  }, [dataQuery.loading, isEdit]);

  const onSaveSuccess = (message) => {
    showNotification(message, "success");
    setIsSaving(false);
    close(); // not onClose: the changes are saved, so there's nothing to confirm
    onSaved?.();
  };

  const saveTransaction = (values) => {
    setIsSaving(true);
    const request = buildTransactionRequest(values, typeValue, payeeList);
    const call = isEdit
      ? callApi.put(`transaction/update/${transactionId}`, request)
      : callApi.post("transaction/create", request);
    call
      .then(() =>
        onSaveSuccess(isEdit ? "Transaction saved" : "Transaction created")
      )
      .catch(() => setIsSaving(false));
  };

  const deleteTransaction = () => {
    setIsSaving(true);
    callApi
      .delete(`transaction/delete/${transactionId}`)
      .then(() => onSaveSuccess("Transaction deleted"))
      .catch(() => setIsSaving(false));
  };

  const openDeleteConfirmModal = () =>
    openDeleteConfirm({
      label: "Transaction",
      message:
        "Are you sure you want to delete this transaction? This action will revert this transaction.",
      onConfirm: deleteTransaction,
    });

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

  const onChangeType = (value) => {
    // Payees and categories belong to one type, so the old choices don't carry over
    form.setValues((prev) => ({ ...prev, payeeId: null, categoryId: null }));
    setIsCategoryDisabled(false);
    setTypeValue(value);
    focusField(payeeRef);
  };

  const onSelectSuggestedPayee = (payee) => {
    // The suggestion already holds the payee (id, name, category), so no request is needed
    addPayee(payee);
    form.setFieldValue("payeeId", idString(payee.id));
    focusField(accountRef);
  };

  const onSelectSuggestedAccount = (account) => {
    form.setFieldValue("sourceAccountId", idString(account.id));
    focusField(typeValue === TYPE.TRANSFER ? targetAccountRef : amountRef);
  };

  const onChangeSourceAccount = (value) => {
    form.setFieldValue("sourceAccountId", value);
    const target = findAccount(accountList, form.getValues().targetAccountId);
    if (target && !targetOptions(accountList, value).includes(target)) {
      form.setFieldValue("targetAccountId", null);
    }
    if (value) {
      focusField(typeValue === TYPE.TRANSFER ? targetAccountRef : amountRef);
    }
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

  const sourceAccountId = form.getValues()?.sourceAccountId;
  const toAccountOption = (account) => ({
    value: idString(account.id),
    label: accountOptionLabel(account),
  });
  // Props every Select in the form shares
  const selectProps = {
    filter: trLocaleFilter,
    searchable: true,
    disabled: isLoading,
    mt: "md",
    size: "md",
  };

  return (
    <Modal
      opened
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
      <TransactionTypeControl
        value={typeValue}
        onChange={onChangeType}
        disabled={isLoading}
      />
      {loadError && (
        <LoadError
          mt="md"
          title={
            notFound
              ? "Transaction not found"
              : "Couldn't load the transaction form"
          }
          message={notFound ? notFoundMessage("Transaction") : undefined}
          onRetry={notFound ? undefined : dataQuery.retry}
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
                {...selectProps}
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
                  value: idString(payee.id),
                  label: payee.name,
                }))}
                {...form.getInputProps("payeeId")}
                onChange={(value) => {
                  form.setFieldValue("payeeId", value);
                  if (value)
                    focusField(
                      value === NEW_PAYEE_OPTION_ID ? categoryRef : accountRef
                    );
                }}
                required
              />
              <Select
                {...selectProps}
                ref={categoryRef}
                label="Category"
                placeholder="Category"
                clearable={true}
                data={categoryList
                  .filter(
                    (category) => category.transactionType?.value === typeValue
                  )
                  .map((category) => ({
                    value: idString(category.id),
                    label: categoryLabel(category),
                  }))}
                {...form.getInputProps("categoryId")}
                onChange={(value) => {
                  form.setFieldValue("categoryId", value);
                  if (value) focusField(accountRef);
                }}
                nothingFoundMessage={`Nothing found. Add a new ${TYPE_LABEL[typeValue]?.toLowerCase()} category from the categories page.`}
                required
                disabled={isLoading || isCategoryDisabled}
              />
              <Select
                {...selectProps}
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
                {...form.getInputProps("sourceAccountId")}
                onChange={onChangeSourceAccount}
                nothingFoundMessage={createAccountLink("Nothing found.")}
                required
              />
              {typeValue === TYPE.TRANSFER && (
                <Select
                  {...selectProps}
                  ref={targetAccountRef}
                  label="Target Account"
                  placeholder="Select Target Account"
                  description="Target account's currency must match the source account's currency"
                  clearable={false}
                  data={targetOptions(accountList, sourceAccountId).map(
                    toAccountOption
                  )}
                  {...form.getInputProps("targetAccountId")}
                  onChange={(value) => {
                    form.setFieldValue("targetAccountId", value);
                    if (value) focusField(amountRef);
                  }}
                  nothingFoundMessage={createAccountLink(
                    "No suitable account found of this type."
                  )}
                  required
                />
              )}
              <AmountInput
                ref={amountRef}
                label="Amount"
                placeholder="Transaction Amount"
                required={true}
                form={form}
                fieldName="amount"
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
                      const selectedAccount = findAccount(
                        accountList,
                        sourceAccountId
                      );
                      if (selectedAccount) {
                        form.setFieldValue("amount", selectedAccount.balance);
                      }
                    }}
                  >
                    All
                  </Button>
                }
              />
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
