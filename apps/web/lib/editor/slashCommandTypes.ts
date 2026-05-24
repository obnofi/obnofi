export type SlashCommandItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  shortcut?: string;
  isDisabled?: boolean;
  isObnofi?: boolean;
  keywords?: string[];
};

export type SlashCommandCategory = {
  id: string;
  label: string;
};
