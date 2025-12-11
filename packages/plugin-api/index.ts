export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    main: string; // Entry point file
}

export interface CinetronPlugin {
    onLoad(context: PluginContext): Promise<void> | void;
    onUnload(): Promise<void> | void;
}

export interface PluginContext {
    registerHook(hookName: string, callback: Function): void;
    getLogger(): any;
}
