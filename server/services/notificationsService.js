const prisma = require("../lib/prisma");
const { normalizePagination, paginationMeta } = require("../lib/pagination");

async function getNotificationsForUser(userId, query = {}) {
  const pagination = normalizePagination(query, 20);
  const where = { recipientId: Number(userId), channel: "IN_APP" };
  const [total, data] = await Promise.all([prisma.notification.count({ where }), prisma.notification.findMany({
    where: {
      recipientId: Number(userId),
      channel: "IN_APP",
    },
    select: {
      id: true,
      type: true,
      createdAt: true,
      requestId: true,
      meetingId: true,
    },
    orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.pageSize,
  })]);
  return { data, pagination: paginationMeta({ ...pagination, total }) };
}

module.exports = { getNotificationsForUser };
