import {spawn} from "node:child_process";

export type FolderPickResult={cancelled:boolean;path:string|null;message:string};

export function chooseProjectFolder():Promise<FolderPickResult>{
  if(process.platform!=="win32"){
    return Promise.resolve({cancelled:true,path:null,message:"Native folder picker is currently Windows-only."});
  }
  const script=[
    "Add-Type -AssemblyName System.Windows.Forms;",
    "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog;",
    "$dialog.Description = 'Select project folder';",
    "$dialog.ShowNewFolderButton = $false;",
    "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {",
    " [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;",
    " Write-Output $dialog.SelectedPath",
    "}"
  ].join(" ");
  return new Promise((resolve)=>{
    const child=spawn("powershell.exe",["-NoProfile","-STA","-Command",script],{windowsHide:false});
    let stdout="";
    child.stdout?.on("data",(chunk)=>{stdout+=String(chunk);});
    child.on("error",(error)=>{
      resolve({cancelled:true,path:null,message:error.message||"Folder picker failed."});
    });
    child.on("close",()=>{
      const selected=String(stdout||"").trim().split(/\r?\n/).filter(Boolean).pop()||null;
      resolve({cancelled:!selected,path:selected,message:selected?"Folder selected.":"Folder selection cancelled."});
    });
  });
}
