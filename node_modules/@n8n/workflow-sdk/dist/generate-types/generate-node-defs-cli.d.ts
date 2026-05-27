export interface GenerateNodeDefinitionsOptions {
    nodesJsonPath: string;
    outputDir: string;
    packageName?: string;
}
export declare function computeInputHash(content: string, sdkVersion: string): string;
export declare function generateNodeDefinitions(options: GenerateNodeDefinitionsOptions): Promise<void>;
