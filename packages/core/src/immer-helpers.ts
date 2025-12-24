/**
 * Helper function to check if an error is an Immer error about non-draftable types.
 * Immer throws errors when trying to use produce() on classes or other non-draftable types.
 *
 * @param error - The error to check
 * @returns true if the error is an Immer non-draftable error
 */
export function isImmerNonDraftableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("immer") &&
    (message.includes("draftable") ||
      message.includes("can only be called on things") ||
      message.includes("not draftable"))
  );
}
