const verifiedProductionUrl = "https://chronos.yuvrajkashyap.com";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return new URL(verifiedProductionUrl);
  }

  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(verifiedProductionUrl);
  }
}
