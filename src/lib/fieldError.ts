/**
 * Field-level validation errors are linked to their controls (WCAG 3.3.1, 1.3.1):
 * the message element uses `fieldErrorId(fieldId)` and the control references it
 * through `aria-describedby` while it is `aria-invalid`.
 */
export function fieldErrorId(fieldId: string) {
  return `${fieldId}-error`;
}

export function fieldErrorAriaProps(
  fieldId: string | undefined,
  error: string | undefined,
  describedBy?: string,
) {
  const errorId = error && fieldId ? fieldErrorId(fieldId) : undefined;
  const ids = [describedBy, errorId].filter(Boolean).join(' ');
  return {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': ids || undefined,
  };
}
