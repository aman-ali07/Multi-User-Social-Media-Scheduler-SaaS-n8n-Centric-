import type { ConnectionTarget, NodeInstance } from '../../../types/base';
import type { MutablePluginContext } from '../types';
export declare function getTargetNodeId(target: unknown): string | undefined;
export declare function getTargetNodeName(target: unknown): string | undefined;
export declare function collectFromTarget(target: unknown, collector: (node: NodeInstance<string, string, unknown>) => void): void;
export declare function addBranchTargetNodes(target: unknown, ctx: MutablePluginContext): void;
export declare function processBranchForComposite(branch: unknown, outputIndex: number, ctx: MutablePluginContext, mainConns: Map<number, ConnectionTarget[]>): void;
export declare function processBranchForBuilder(branch: unknown, outputIndex: number, mainConns: Map<number, ConnectionTarget[]>, targetNodeIds?: Map<number, string[]>): void;
export declare function fixupBranchConnectionTargets(mainConns: Map<number, ConnectionTarget[]>, targetNodeIds: Map<number, string[]>, nameMapping: Map<string, string>): void;
