export type WorkspaceTabKind="file"|"terminal"|"diff";

export type WorkspaceTab={
  id:string;
  kind:WorkspaceTabKind;
  title:string;
  resource:string;
  pinned:boolean;
};

export type SplitEditorState={
  enabled:boolean;
  primaryTabId:string|null;
  secondaryTabId:string|null;
};

export type ToastKind="info"|"success"|"warning"|"error";

export type ToastMessage={
  id:string;
  kind:ToastKind;
  title:string;
  message:string;
  createdAt:string;
  timeoutMs:number;
};

export type ModalState={
  id:string;
  title:string;
  body:string;
  confirmLabel:string|null;
  cancelLabel:string|null;
};

export type CommandPaletteEntry={
  id:string;
  label:string;
  description:string;
  keywords:string[];
  action:string;
};
