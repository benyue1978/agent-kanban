export {
  getProtectedSections,
  getSourceTaskMetadata,
  upsertSourceTaskMetadata,
  type ProtectedSections,
  type SourceTaskMetadata,
} from "./anchors.js";
export {
  appendCompletionSummary,
  replaceCompletionSummary,
  isSectionComplete,
  SummaryValidationError,
  validateCompletionSummary,
} from "./summary.js";
