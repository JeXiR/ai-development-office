# AI Development Kit Integration

v0.1 expects the Kit to optionally emit:

- `.ai-kit/events.jsonl`
- `.ai-kit/office-state.json`

The Office Bridge watches those files and sends updates through WebSocket.

## Important
The Office does not require application code changes.

## Demo
1. Copy `.env.example` to `.env.local`
2. Set `OFFICE_PROJECT_PATH`
3. `npm install`
4. `npm run bridge`
5. `node scripts/write-demo-state.mjs D:\laragon\www\callme`
6. `node scripts/simulate-office-events.mjs D:\laragon\www\callme`
7. `npm run dev`
