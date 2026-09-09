export type FloorChatKind =
  | "finding"
  | "work"
  | "event"
  | "command"
  | "gate"
  | "doctor"
  | "recovery"
  | "coverage"
  | "progress"
  | "lesson";

export type FloorChatLang = "tr" | "en" | "de" | "ru";

export type FloorChatAgent = {
  id: string;
  role: string;
  displayName?: string | null;
};

export type FloorChatTopic = {
  key: string;
  fingerprint: string;
  kind: FloorChatKind;
  title: string;
  detail: string;
  status: string;
  severity?: string;
  next?: string;
  preferredRoles: string[];
};

export type FloorChatMessage = {
  id: string;
  projectId: string;
  fromId: string;
  fromRole: string;
  toId: string;
  toRole: string;
  text: string;
  kind: FloorChatKind;
  topicKey: string;
  createdAt: number;
};

export type FloorChatMemory = {
  fingerprints: string[];
  texts: string[];
  lastStatus: Record<string, string>;
  lastAt: Record<string, number>;
  angle: Record<string, number>;
};
