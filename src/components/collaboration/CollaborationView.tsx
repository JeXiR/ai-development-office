"use client";
import {DirectorPanel} from "./DirectorPanel";
import {MailboxPanel} from "./MailboxPanel";
import {BlackboardPanel} from "./BlackboardPanel";
import {ArtifactPanel} from "./ArtifactPanel";

export function CollaborationView(){
  return <div className="collaboration-shell">
    <DirectorPanel/>
    <div className="two-col"><MailboxPanel/><BlackboardPanel/></div>
    <ArtifactPanel/>
  </div>;
}
