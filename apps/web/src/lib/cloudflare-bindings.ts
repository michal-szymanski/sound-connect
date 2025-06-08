export async function getBindings() {
  if (import.meta.env.DEV) {
    const { getPlatformProxy } = await import("wrangler");
    const { env } = await getPlatformProxy();
    return env as unknown as CloudflareBindings;
  }

  return process.env as unknown as CloudflareBindings;
}
