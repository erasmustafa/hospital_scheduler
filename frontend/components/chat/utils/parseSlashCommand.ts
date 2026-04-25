export type SlashCommandName =
  | "reminder"
  | "task"
  | "shift"
  | "decision"
  | "agenda"
  | "poll";

export type SlashCommandParseResult = {
  isCommand: boolean;
  command?: SlashCommandName;
  args: string;
};

const SUPPORTED_COMMANDS: SlashCommandName[] = [
  "reminder",
  "task",
  "shift",
  "decision",
  "agenda",
  "poll",
];

export default function parseSlashCommand(input: string): SlashCommandParseResult {
  const value = input.trim();
  if (!value.startsWith("/")) {
    return { isCommand: false, args: value };
  }

  const [commandToken, ...restTokens] = value.slice(1).split(/\s+/);
  const normalized = commandToken.toLowerCase() as SlashCommandName;

  if (!SUPPORTED_COMMANDS.includes(normalized)) {
    return { isCommand: false, args: value };
  }

  return {
    isCommand: true,
    command: normalized,
    args: restTokens.join(" ").trim(),
  };
}
