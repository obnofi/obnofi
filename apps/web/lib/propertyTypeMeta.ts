import { PropertyType } from "@obnofi/types/database";

export const ALL_PROPERTY_TYPES: PropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "checkbox",
  "url",
  "email",
  "phone",
  "files",
  "relation",
  "rollup",
  "formula",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
];

export const BASIC_PROPERTY_TYPES: PropertyType[] = [
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "checkbox",
  "url",
  "email",
  "phone",
];

export function getPropertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case "text": return "Text";
    case "number": return "Number";
    case "select": return "Select";
    case "multi_select": return "Multi-select";
    case "status": return "Status";
    case "date": return "Date";
    case "person": return "Person";
    case "checkbox": return "Checkbox";
    case "url": return "URL";
    case "email": return "Email";
    case "phone": return "Phone";
    case "files": return "Files & media";
    case "relation": return "Relation";
    case "rollup": return "Rollup";
    case "formula": return "Formula";
    case "created_time": return "Created time";
    case "created_by": return "Created by";
    case "last_edited_time": return "Last edited time";
    case "last_edited_by": return "Last edited by";
    default: return type;
  }
}

export function getPropertyTypeIcon(type: PropertyType): string {
  switch (type) {
    case "text": return "Type";
    case "number": return "Hash";
    case "select": return "List";
    case "multi_select": return "ListChecks";
    case "status": return "Kanban";
    case "date": return "Calendar";
    case "person": return "User";
    case "checkbox": return "CheckSquare";
    case "url": return "Link";
    case "email": return "Mail";
    case "phone": return "Phone";
    case "files": return "Paperclip";
    case "relation": return "ArrowLeftRight";
    case "rollup": return "Calculator";
    case "formula": return "FunctionSquare";
    case "created_time":
    case "last_edited_time": return "Clock";
    case "created_by": return "UserPlus";
    case "last_edited_by": return "Edit3";
    default: return "HelpCircle";
  }
}

export function requiresOptions(type: PropertyType): boolean {
  return type === "select" || type === "multi_select" || type === "status";
}

export function getPropertyPlaceholder(type: PropertyType): string {
  switch (type) {
    case "text": return "Enter text...";
    case "number": return "Enter number...";
    case "url": return "https://...";
    case "email": return "email@example.com";
    case "phone": return "+1 (555) 000-0000";
    default: return "";
  }
}
