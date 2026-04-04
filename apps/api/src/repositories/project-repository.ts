import { defaultProjectPolicy, type ProjectDetail, type ProjectPolicy } from "@agent-kanban/contracts";
import { Prisma, type PrismaClient } from "@prisma/client";

interface CreateProjectInput {
  description?: string | null;
  name: string;
  policy?: ProjectPolicy;
  repoUrl: string;
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
