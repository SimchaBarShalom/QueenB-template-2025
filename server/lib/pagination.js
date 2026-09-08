const MAX_PAGE_SIZE = 50;

function normalizePagination(query = {}, defaultPageSize = 20) {
  const pageValue = Number(query.page);
  const sizeValue = Number(query.pageSize);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSize = Number.isInteger(sizeValue) && sizeValue > 0
    ? Math.min(sizeValue, MAX_PAGE_SIZE)
    : defaultPageSize;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function paginationMeta({ page, pageSize, total }) {
  return { page, pageSize, total, pageCount: Math.ceil(total / pageSize) };
}

module.exports = { MAX_PAGE_SIZE, normalizePagination, paginationMeta };
