export const CALLME_PROFILE={
  id:"callme",
  name:"CallMe",
  expectedPath:"D:\\laragon\\www\\callme",
  stack:{
    framework:"laravel",
    frontend:"inertia-react",
    tenancy:"path-tenancy"
  },
  expectedFiles:[
    "artisan",
    "composer.json",
    "package.json"
  ],
  optionalFiles:[
    "vite.config.ts",
    "vite.config.js",
    "resources/js",
    "docs",
    "PROGRESS.md"
  ],
  expectedEvidence:{
    testCommand:"php artisan test",
    gitRequired:true,
    docsPreferred:true
  }
} as const;
