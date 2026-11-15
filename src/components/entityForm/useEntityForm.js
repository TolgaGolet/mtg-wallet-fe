// @ts-check
import { useState } from "react";
import { useForm } from "@mantine/form";
import { useLocation, useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import useApiQuery from "../../utils/useApiQuery";
import showNotification from "../showNotification";
import openDeleteConfirm from "../openDeleteConfirm";
import { fetchById, isNotFound } from "../../api/fetchById";

/**
 * @template {Record<string, any>} Values
 * @typedef {object} EntityFormConfig
 * @property {string} entity API resource, e.g. "payee" (`payee/create/enums`, `payee/update/:id`, ...)
 * @property {string} id the route param; the literal "create" means create mode
 * @property {string} label singular display name, e.g. "Payee"
 * @property {string} listPath where to go after a create or delete, e.g. "/payees"
 * @property {string} [afterUpdatePath] where to go after an update when the form was opened directly
 *   (defaults to `listPath`); opened from another page, an update goes back to that page
 * @property {Values} initialValues
 * @property {import("@mantine/form").FormValidateInput<Values>} [validate]
 * @property {(details: any) => Values} toFormValues fills the form from the loaded record
 * @property {(values: Values) => object} toCreateRequest only the fields the backend's create request accepts
 * @property {(values: Values) => object} toUpdateRequest only the fields the backend's update request accepts
 */

/**
 * Shared logic of the create/edit pages (Account, Category, Payee): loads the screen enums and,
 * in edit mode, the record (a missing record is a not-found error, not an empty form); submits
 * create or update; and confirms and runs the delete. Each page keeps only its fields and mappers.
 *
 * @template {Record<string, any>} Values
 * @param {EntityFormConfig<Values>} config
 */
export default function useEntityForm({
  entity,
  id,
  label,
  listPath,
  afterUpdatePath = listPath,
  initialValues,
  validate,
  toFormValues,
  toCreateRequest,
  toUpdateRequest,
}) {
  const callApi = useAxios();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = id !== "create";
  const lowerLabel = label.toLowerCase();

  const form = useForm({ validateInputOnBlur: true, initialValues, validate });

  // Enums and (when editing) the record load in parallel; onSuccess fills the form
  const query = useApiQuery(
    async (signal) => {
      const [enums, details] = await Promise.all([
        callApi
          .get(`${entity}/create/enums`, { signal })
          .then((response) => response.data),
        isEdit ? fetchById(callApi, entity, id, signal) : null,
      ]);
      return { enums, details };
    },
    [entity, id],
    {
      onSuccess: ({ details }) => {
        if (details) {
          form.setValues(toFormValues(details));
        }
      },
    }
  );

  /**
   * Runs a save or delete, then leaves the page with a success toast (errors are toasted by the client).
   * `goBack`: return to the page that opened the form, if any, instead of adding `path` on top of it
   * (it is usually that same page, and the back button would then seem to do nothing).
   */
  const run = (
    /** @type {Promise<unknown>} */ request,
    /** @type {string} */ path,
    /** @type {string} */ message,
    goBack = false
  ) => {
    setIsSaving(true);
    request
      .then(() => {
        setIsSaving(false);
        // The router gives only the entry the app opened on the "default" key: opened directly
        if (goBack && location.key !== "default") {
          navigate(-1);
        } else {
          navigate(path, { replace: true });
        }
        showNotification(message, "success");
      })
      .catch(() => setIsSaving(false));
  };

  const onSubmit = form.onSubmit((values) =>
    isEdit
      ? run(
          callApi.put(`${entity}/update/${id}`, toUpdateRequest(values)),
          afterUpdatePath,
          `${label} updated successfully`,
          true
        )
      : run(
          callApi.post(`${entity}/create`, toCreateRequest(values)),
          listPath,
          `${label} created successfully`
        )
  );

  const deleteEntity = () =>
    run(
      callApi.delete(`${entity}/delete/${id}`),
      listPath,
      `${label} deleted successfully`
    );

  const confirmDelete = () =>
    openDeleteConfirm({
      label,
      message: `Are you sure you want to delete this ${lowerLabel}? This action won't delete your transactions.`,
      onConfirm: deleteEntity,
    });

  return {
    form,
    isEdit,
    label,
    listPath,
    isLoading: query.loading || isSaving,
    loadError: Boolean(query.error),
    notFound: isNotFound(query.error),
    retry: query.retry,
    enums: query.data?.enums,
    details: query.data?.details,
    onSubmit,
    confirmDelete,
  };
}
