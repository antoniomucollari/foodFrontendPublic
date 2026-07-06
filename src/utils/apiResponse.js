export const getResponsePayload = (response) =>
  response?.data?.data ?? response?.data;

export const getPageContent = (response) => {
  const payload = getResponsePayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  return [];
};

export const getPageMeta = (response) => {
  const payload = getResponsePayload(response);
  const content = getPageContent(response);

  return {
    totalElements: payload?.totalElements ?? content.length,
    totalPages: payload?.totalPages ?? 1,
    number: payload?.number ?? 0,
    size: payload?.size ?? content.length,
    first: payload?.first ?? true,
    last: payload?.last ?? true,
  };
};
