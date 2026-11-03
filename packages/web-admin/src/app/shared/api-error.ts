export function extractApiError(err: any, fallback: string): string {
  return err?.error?.message ?? fallback
}
