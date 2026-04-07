import {
  CardState,
  defaultProjectPolicy,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectPolicy,
} from "@agent-kanban/contracts";
import { Prisma, type PrismaClient } from "@prisma/client";

interface CreateProjectInput {
  description?: string | null;
  name: string;
  policy?: ProjectPolicy;
  repoUrl: string;
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<ProjectListItem[]> {
    const projects = await this.prisma.project.findMany({
      include: {
        cards: {
          where: {
            archivedAt: null,
          },
          select: {
            state: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return projects.map((project) => {
      const countsByState: ProjectListItem["countsByState"] = {
        [CardState.New]: 0,
        [CardState.Ready]: 0,
        [CardState.InProgress]: 0,
        [CardState.InReview]: 0,
        [CardState.Done]: 0,
      };

      for (const card of project.cards) {
        if (card.state in countsByState) {
          countsByState[card.state as keyof typeof countsByState] += 1;
        }
      }

      return {
        id: project.id,
        name: project.name,
        repoUrl: project.repoUrl,
        countsByState,
      };
    });
  }

  async create(input: CreateProjectInput): Promise<ProjectDetail> {
    const project = await this.prisma.project.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        repoUrl: input.repoUrl,
        policyJson: (input.policy ?? defaultProjectPolicy) as Prisma.InputJsonValue,
      },
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      policy: project.policyJson as unknown as ProjectPolicy,
    };
  }
}
