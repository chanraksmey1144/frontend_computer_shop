export function parseApiCollection(response) {
  let payload = response?.data ?? response ?? {};

  if (
    payload &&
    !Array.isArray(payload) &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'success') &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    payload = payload.data;
  }

  if (Array.isArray(payload)) return { items: payload, meta: {} };

  if (payload && Array.isArray(payload.data)) {
    return { items: payload.data, meta: payload };
  }

  if (payload && Array.isArray(payload.items)) {
    return { items: payload.items, meta: payload.meta || {} };
  }

  return { items: [], meta: {} };
}

export async function fetchAllPages(request, params = {}) {
  const items = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await request({ ...params, page });
    const result = parseApiCollection(response);
    items.push(...result.items);

    if (!Array.isArray(result.meta.data)) break;
    lastPage = Number(result.meta.last_page) || page;
    page += 1;
  } while (page <= lastPage);

  return items;
}
