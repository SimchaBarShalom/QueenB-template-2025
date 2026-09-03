const prisma = require("../lib/prisma");
const { sanitizeUser } = require("./authService");

async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return users.map(sanitizeUser);
}


module.exports = {
  getAllUsers
};
