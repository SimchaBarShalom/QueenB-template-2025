const bcrypt = require("bcryptjs");
const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

const seedUsers = [
  {
    email: "admin@queenb.org",
    firstName: "Admin",
    lastName: "QueenB",
    role: Role.ADMIN,
    password: "Admin123!",
  },
  {
    email: "mentor@queenb.org",
    firstName: "Mentor",
    lastName: "Example",
    role: Role.MENTOR,
    password: "Mentor123!",
  },
  {
    email: "mentee@queenb.org",
    firstName: "Mentee",
    lastName: "Example",
    role: Role.MENTEE,
    password: "Mentee123!",
  },
];

async function main() {
  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
