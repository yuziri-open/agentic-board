import type { ChangeEvent } from "react";
import type { AgentRole, AdapterType } from "@kaisha/shared";

export type SupportedAdapterType = Extract<AdapterType, "claude_code" | "codex" | "shell">;
export type ClaudePermissionMode = "default" | "acceptEdits" | "bypassPermissions";
export type CodexApprovalMode = "full-auto" | "suggest" | "ask";
export type ShellMode = "bash" | "powershell" | "true";

export type AgentDraft = {
  name: string;
  role: AgentRole;
  adapterType: SupportedAdapterType;
  claudeModel: string;
  claudePermissionMode: ClaudePermissionMode;
  codexModel: string;
  codexApprovalMode: CodexApprovalMode;
  shellCommand: string;
  shellMode: ShellMode;
};

type AgentEditorFieldsProps = {
  draft: AgentDraft;
  onChange: (draft: AgentDraft) => void;
  idPrefix?: string;
};

const labelClassName = "flex flex-col gap-2";
const labelTextClassName = "text-xs font-medium uppercase tracking-[0.24em]";
const controlClassName =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400/50";
const helpTextClassName = "text-sm leading-6";
const optionStyle = {
  background: "var(--card-strong-bg)",
  color: "var(--text-primary)"
} as const;

const roleOptions: Array<{ value: AgentRole; label: string }> = [
  { value: "ceo", label: "CEO" },
  { value: "manager", label: "マネージャー" },
  { value: "worker", label: "ワーカー" }
];

const adapterOptions: Array<{ value: SupportedAdapterType; label: string; description: string }> = [
  {
    value: "claude_code",
    label: "Claude Code",
    description: "AnthropicのCLIエージェント。コード生成・編集に最適"
  },
  {
    value: "codex",
    label: "Codex",
    description: "OpenAIのCLIエージェント。自律的なコード実装が可能"
  },
  {
    value: "shell",
    label: "Shell",
    description: "任意のシェルコマンドを実行するアダプター"
  }
];

const permissionOptions: Array<{ value: ClaudePermissionMode; label: string }> = [
  { value: "default", label: "標準" },
  { value: "acceptEdits", label: "編集を許可" },
  { value: "bypassPermissions", label: "全権限バイパス" }
];

const codexApprovalOptions: Array<{ value: CodexApprovalMode; label: string }> = [
  { value: "full-auto", label: "フルオート" },
  { value: "suggest", label: "提案モード" },
  { value: "ask", label: "確認モード" }
];

const shellOptions: Array<{ value: ShellMode; label: string }> = [
  { value: "powershell", label: "PowerShell" },
  { value: "bash", label: "Bash" },
  { value: "true", label: "システム標準" }
];

export function createDefaultAgentDraft(): AgentDraft {
  return {
    name: "",
    role: "worker",
    adapterType: "claude_code",
    claudeModel: "claude-sonnet-4-20250514",
    claudePermissionMode: "default",
    codexModel: "gpt-5.4-codex",
    codexApprovalMode: "full-auto",
    shellCommand: "echo KAISHA shell adapter ready",
    shellMode: "powershell"
  };
}

export function buildAgentPayload(draft: AgentDraft) {
  return {
    name: draft.name.trim(),
    role: draft.role,
    adapterType: draft.adapterType,
    adapterConfig: getAdapterConfig(draft)
  };
}

export function getAdapterSummary(draft: AgentDraft): string {
  switch (draft.adapterType) {
    case "claude_code":
      return `${draft.claudeModel} / ${humanize(draft.claudePermissionMode)}`;
    case "codex":
      return `${draft.codexModel} / ${humanize(draft.codexApprovalMode)}`;
    case "shell":
      return `${draft.shellMode === "true" ? "システム標準" : draft.shellMode} / ${draft.shellCommand}`;
    default:
      return "";
  }
}

export function AgentEditorFields({ draft, onChange, idPrefix = "agent" }: AgentEditorFieldsProps) {
  const update = <K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const handleTextInput = (key: keyof AgentDraft) => (event: ChangeEvent<HTMLInputElement>) => {
    update(key as never, event.target.value as never);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClassName}>
          <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>
            エージェント名
          </span>
          <input
            id={`${idPrefix}-name`}
            className={controlClassName}
            style={controlStyle}
            value={draft.name}
            onChange={handleTextInput("name")}
            placeholder="エージェント名"
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>
            ロール
          </span>
          <select
            id={`${idPrefix}-role`}
            className={controlClassName}
            style={controlStyle}
            value={draft.role}
            onChange={(event) => update("role", event.target.value as AgentRole)}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value} style={optionStyle}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClassName}>
        <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>
          アダプター
        </span>
        <select
          id={`${idPrefix}-adapter`}
          className={controlClassName}
          style={controlStyle}
          value={draft.adapterType}
          onChange={(event) => update("adapterType", event.target.value as SupportedAdapterType)}
        >
          {adapterOptions.map((option) => (
            <option key={option.value} value={option.value} style={optionStyle}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={helpTextClassName} style={{ color: "var(--text-secondary)" }}>
          {adapterOptions.find((option) => option.value === draft.adapterType)?.description}
        </span>
      </label>

      <div className="rounded-[28px] border p-5" style={{ borderColor: "var(--border-weak)", background: "var(--card-bg)" }}>
        <div className="mb-4">
          <p className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>
            アダプター設定
          </p>
          <p className={`mt-2 ${helpTextClassName}`} style={{ color: "var(--text-secondary)" }}>
            選択したアダプターの詳細設定を行います
          </p>
        </div>

        {draft.adapterType === "claude_code" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>モデル</span>
              <input id={`${idPrefix}-claude-model`} className={controlClassName} style={controlStyle} value={draft.claudeModel} onChange={handleTextInput("claudeModel")} />
            </label>
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>権限モード</span>
              <select id={`${idPrefix}-claude-permission`} className={controlClassName} style={controlStyle} value={draft.claudePermissionMode} onChange={(event) => update("claudePermissionMode", event.target.value as ClaudePermissionMode)}>
                {permissionOptions.map((option) => <option key={option.value} value={option.value} style={optionStyle}>{option.label}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        {draft.adapterType === "codex" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>モデル</span>
              <input id={`${idPrefix}-codex-model`} className={controlClassName} style={controlStyle} value={draft.codexModel} onChange={handleTextInput("codexModel")} />
            </label>
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>承認モード</span>
              <select id={`${idPrefix}-codex-approval`} className={controlClassName} style={controlStyle} value={draft.codexApprovalMode} onChange={(event) => update("codexApprovalMode", event.target.value as CodexApprovalMode)}>
                {codexApprovalOptions.map((option) => <option key={option.value} value={option.value} style={optionStyle}>{option.label}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        {draft.adapterType === "shell" ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)]">
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>コマンド</span>
              <input id={`${idPrefix}-shell-command`} className={controlClassName} style={controlStyle} value={draft.shellCommand} onChange={handleTextInput("shellCommand")} placeholder="echo テスト" />
            </label>
            <label className={labelClassName}>
              <span className={labelTextClassName} style={{ color: "var(--text-tertiary)" }}>シェル</span>
              <select id={`${idPrefix}-shell-mode`} className={controlClassName} style={controlStyle} value={draft.shellMode} onChange={(event) => update("shellMode", event.target.value as ShellMode)}>
                {shellOptions.map((option) => <option key={option.value} value={option.value} style={optionStyle}>{option.label}</option>)}
              </select>
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getAdapterConfig(draft: AgentDraft): Record<string, unknown> {
  switch (draft.adapterType) {
    case "claude_code":
      return { model: draft.claudeModel.trim(), permissionMode: draft.claudePermissionMode };
    case "codex":
      return { model: draft.codexModel.trim(), approval: draft.codexApprovalMode };
    case "shell":
      return { command: draft.shellCommand.trim(), shell: draft.shellMode === "true" ? true : draft.shellMode };
  }
}

function humanize(value: string) {
  return value.replaceAll(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
}

const controlStyle = {
  borderColor: "var(--border-weak)",
  background: "var(--card-strong-bg)",
  color: "var(--text-primary)"
} as const;
