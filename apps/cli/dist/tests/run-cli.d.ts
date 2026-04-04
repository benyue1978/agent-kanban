export interface CliResult {
    exitCode: number;
    stderr: string;
    stdout: string;
}
export declare function runCli(args: string[], env?: NodeJS.ProcessEnv): Promise<CliResult>;
//# sourceMappingURL=run-cli.d.ts.map