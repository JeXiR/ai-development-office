export type PixelCameraState={x:number;y:number;zoom:number};

export function clampCamera(camera:PixelCameraState){
  return {
    x:Number.isFinite(camera.x)?camera.x:0,
    y:Number.isFinite(camera.y)?camera.y:0,
    zoom:Math.max(.7,Math.min(3.4,Number.isFinite(camera.zoom)?camera.zoom:1))
  };
}

export function defaultCameraForHost(_width:number,_height:number){
  // zoom=1 → applyCamera uses only the host fit scale, so the whole floor is visible.
  return clampCamera({x:0,y:0,zoom:1});
}

export function zoomCamera(camera:PixelCameraState,delta:number){
  return clampCamera({...camera,zoom:camera.zoom+delta});
}

export function panCamera(camera:PixelCameraState,dx:number,dy:number){
  return clampCamera({...camera,x:camera.x+dx,y:camera.y+dy});
}
