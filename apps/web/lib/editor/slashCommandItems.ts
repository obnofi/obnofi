import { coreSlashCommands } from "@/lib/editor/slashCommandItemsCore";
import { extendedSlashCommands } from "@/lib/editor/slashCommandItemsExtended";

export const slashCommands = [...coreSlashCommands, ...extendedSlashCommands];
