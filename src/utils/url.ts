export function buildUrlWithQueryParams(
  baseUrl: string,
  queryParams?: Record<string, string>
): string {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return baseUrl;
  }

  const urlSearchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    urlSearchParams.append(key, String(value));
  });

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${urlSearchParams.toString()}`;
}
