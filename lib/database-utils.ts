import { Column, ColumnType, PropertyValueData } from "@/types";

export const DATABASE_COLUMN_TYPES: ColumnType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "person",
  "checkbox",
  "url",
  "email",
];

export function createDefaultPropertyValue(column: Pick<Column, "type">): PropertyValueData {
  switch (column.type) {
    case "number":
      return { type: "number", value: null };
    case "select":
      return { type: "select", optionId: null };
    case "multi_select":
      return { type: "multi_select", optionIds: [] };
    case "date":
      return { type: "date", value: null };
    case "person":
      return { type: "person", userId: null };
    case "checkbox":
      return { type: "checkbox", value: false };
    case "url":
      return { type: "url", value: "" };
    case "email":
      return { type: "email", value: "" };
    case "text":
    default:
      return { type: "text", value: "" };
  }
}

export function getColumnTypeLabel(type: ColumnType) {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "select":
      return "Select";
    case "multi_select":
      return "Multi Select";
    case "date":
      return "Date";
    case "person":
      return "Person";
    case "checkbox":
      return "Checkbox";
    case "url":
      return "URL";
    case "email":
      return "Email";
  }
}
