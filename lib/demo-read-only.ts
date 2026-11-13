/** Blocks archive-content mutations when deployed as an informational demo. */
export function demoReadOnlyFailure(): Response | null {
  // Administrative records and uploads still use .data. Vercel's filesystem is
  // ephemeral, so never report a successful mutation there.
  if (process.env.VERCEL === '1') {
    return Response.json(
      { error: 'Persistent administrative storage is not configured for this deployment' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (process.env.DEMO_READ_ONLY !== 'true') return null;
  return Response.json(
    { error: 'Archive content is read-only in this demonstration' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
