const prisma = require("../lib/prisma");

async function getNotificationsForUser(userId) {
  return prisma.notification.findMany({
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
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}

module.exports = { getNotificationsForUser };
