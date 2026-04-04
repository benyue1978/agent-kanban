import type { ApiClient } from "../client.js";
export interface CommandEnvironment {
    actorId?: string;
    apiUrl?: string;
    projectId?: string;
}
export interface CommandContext {
    args: string[];
    client: ApiClient;
    env: CommandEnvironment;
}
export declare function parseCommandArgs(args: string[], options: Record<string, {
    type: "boolean" | "string";
}>): {
    values: {
        [x: string]: string | boolean | undefined;
    };
    positionals: [];
};
export declare function requireStringFlag(values: Record<string, string | boolean | undefined>, name: string): string;
export declare function getOptionalStringFlag(values: Record<string, string | boolean | undefined>, name: string): string | undefined;
export declare function getOptionalBooleanFlag(values: Record<string, string | boolean | undefined>, name: string): boolean;
export declare function resolveProjectId(values: Record<string, string | boolean | undefined>, env: CommandEnvironment): string;
export declare function resolveActorId(values: Record<string, string | boolean | undefined>, env: CommandEnvironment, flagName?: string): string | undefined;
export declare function readTextFile(path: string): Promise<string>;
export declare function defaultCardDescription(title: string): string;
export declare function fail(message: string): never;
//# sourceMappingURL=common.d.ts.map