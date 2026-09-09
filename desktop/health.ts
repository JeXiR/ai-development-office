import net from "node:net";

export function waitForPort(port:number,host="127.0.0.1",timeoutMs=20000){
  const started=Date.now();
  return new Promise<boolean>((resolve)=>{
    const probe=()=>{
      const socket=new net.Socket();
      socket.setTimeout(800);
      socket.once("connect",()=>{socket.destroy();resolve(true);});
      socket.once("timeout",()=>{socket.destroy();retry();});
      socket.once("error",()=>{socket.destroy();retry();});
      socket.connect(port,host);
    };
    const retry=()=>{
      if(Date.now()-started>=timeoutMs)return resolve(false);
      setTimeout(probe,250);
    };
    probe();
  });
}
