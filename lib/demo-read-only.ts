/** Blocks archive-content mutations when deployed as an informational demo. */
export function demoReadOnlyFailure(): Response | null {
  if (process.env.DEMO_READ_ONLY !== 'true') return null;
  return Response.json(
    { error: 'Archive content is read-only in this demonstration' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
