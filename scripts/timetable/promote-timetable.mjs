// Pipeline v1 canonical promotion entry point.
// Usage:
// npm run promote:timetable -- --input data/candidates/<approved-file>.json
//
// This command writes canonical meeting and meeting-detail datasets only.
// Public projection remains a separate reviewed stage.
import './promote-approved-candidate-v1.mjs';
