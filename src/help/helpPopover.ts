export function clampHelpPopover(trigger:Element,popover:HTMLElement){
  const rect=trigger.getBoundingClientRect();
  const width=Math.min(300,window.innerWidth-24);
  popover.classList.add("info-help-floating");
  popover.style.position="fixed";
  popover.style.zIndex="20000";
  popover.style.width=`${width}px`;
  popover.style.maxWidth=`min(300px, calc(100vw - 24px))`;
  popover.style.transform="none";
  popover.style.right="auto";
  popover.style.bottom="auto";
  popover.style.margin="0";
  const height=popover.offsetHeight||160;
  let left=rect.left+rect.width/2-width/2;
  left=Math.max(12,Math.min(left,window.innerWidth-width-12));
  const preferTop=rect.top>=height+16||rect.top>window.innerHeight-rect.bottom;
  let top=preferTop?rect.top-height-8:rect.bottom+8;
  if(top<12)top=rect.bottom+8;
  if(top+height>window.innerHeight-12)top=Math.max(12,window.innerHeight-height-12);
  popover.style.left=`${Math.round(left)}px`;
  popover.style.top=`${Math.round(top)}px`;
}
