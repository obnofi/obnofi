import type { Page, Property, PropertyValueData } from "@obnofi/types";

export function getPropertyValueData(
  row: Page,
  propertyId: string
): PropertyValueData | undefined {
  return row.propertyValues?.find(
    (pv) => pv.propertyId === propertyId || pv.columnId === propertyId
  )?.value;
}

function getOptionLabel(property: Property, optionId: string | null | undefined) {
  if (!optionId) return "";
  return property.options?.find((opt) => opt.id === optionId)?.label ?? "";
}

export function getPropertyAccessorValue(row: Page, property: Property): unknown {
  const value = getPropertyValueData(row, property.id);

  if (!value) return null;

  switch (property.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
    case "formula":
    case "created_time":
    case "last_edited_time":
      return "value" in value ? value.value : null;
    case "number":
      return value.type === "number" ? value.value : null;
    case "checkbox":
      return value.type === "checkbox" ? value.value : false;
    case "select":
    case "status":
      return "optionId" in value ? getOptionLabel(property, value.optionId) : "";
    case "multi_select":
      return "optionIds" in value
        ? value.optionIds.map((id) => getOptionLabel(property, id))
        : [];
    case "date":
      return value.type === "date" ? value.value : null;
    case "person":
      return value.type === "person" ? value.userId : null;
    case "relation":
      return value.type === "relation" ? value.pageIds : [];
    case "rollup":
      return value.type === "rollup" ? value.value : null;
    case "created_by":
    case "last_edited_by":
      return "userId" in value ? value.userId : null;
    case "files":
      return value.type === "files" ? value.files.map((f) => f.name) : [];
    default:
      return null;
  }
}

export function normalizeForSearch(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForSearch(item)).join(" ");
  }

  if (typeof value === "boolean") {
    return value ? "checked true" : "unchecked false";
  }

  if (value === null || value === undefined) return "";

  return String(value).toLowerCase();
}
