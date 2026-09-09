import os from "node:os";
import path from "node:path";

export function desktopRuntimeInfo(){
  return {
    platform:process.platform,
    arch:process.arch,
    node:process.version,
    cwd:process.cwd(),
    localAppData:process.env.LOCALAPPDATA||null,
    shell:process.env.OFFICE_DESKTOP_SHELL==="1"?"desktop":"web"
  } as const;
}

export function officeRuntimeRoot(){
  const base=process.env.LOCALAPPDATA||path.join(os.homedir(),"AppData","Local");
  return path.join(base,"AI-Development-Office");
}
