export type ProjectToolName=
  |"read_file"
  |"write_file"
  |"patch_file"
  |"list_files"
  |"run_command"
  |"git_diff"
  |"git_status"
  |"run_tests";

export type ProjectToolCall={
  id:string;
  name:ProjectToolName;
  arguments:Record<string,unknown>;
};

export type ProjectToolResult={
  id:string;
  name:ProjectToolName;
  ok:boolean;
  output:unknown;
  error:string|null;
  evidence?:Record<string,unknown>;
};

export type ProjectExecutionContext={
  projectPath:string;
  missionId:string;
  allowWrites:boolean;
  allowCommands:boolean;
  maxOutputBytes:number;
};
