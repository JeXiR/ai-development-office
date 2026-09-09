"use client";
import {create} from "zustand";
import type {AutoGitPolicy,GitBlameLine,GitConflictFile,PullRequestDraft} from "@/git-intelligence/types";

type SideBySide={file:string;from:string;before:string;after:string}|null;
type ScopedDiff={scope:"task"|"agent";scopeId:string;files:any[]}|null;

type State={
  sideBySide:SideBySide;
  blame:{file:string;lines:GitBlameLine[]}|null;
  conflicts:GitConflictFile[];
  conflictInspection:any|null;
  bisect:any|null;
  scopedDiff:ScopedDiff;
  policy:AutoGitPolicy|null;
  prDraft:PullRequestDraft|null;
  set:(patch:Partial<State>)=>void;
};

export const useGitCodeStore=create<State>(set=>({
  sideBySide:null,blame:null,conflicts:[],conflictInspection:null,bisect:null,scopedDiff:null,policy:null,prDraft:null,
  set:patch=>set(patch)
}));
