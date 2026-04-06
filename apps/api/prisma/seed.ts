import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default collaborators...");

  const agent = await prisma.collaborator.upsert({
    where: { id: "agent" },
    update: {},
    create: {
      id: "agent",
      kind: "agent",
      displayName: "Default Agent",
    },
  });
  console.log(`Ensured collaborator: ${agent.id} (${agent.kind})`);

  const human = await prisma.collaborator.upsert({
    where: { id: "human" },
    update: {},
    create: {
      id: "human",
      kind: "human",
      displayName: "Default Human",
    },
  });
  console.log(`Ensured collaborator: ${human.id} (${human.kind})`);

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
