import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CinetronPlugin, PluginContext } from '@cinetron/plugin-api';

interface LoadedPlugin {
    manifest: any;
    instance: CinetronPlugin;
}

@Injectable()
export class PluginService implements OnModuleInit {
    private readonly logger = new Logger(PluginService.name);
    private plugins: Map<string, LoadedPlugin> = new Map();
    private readonly pluginsDir = path.resolve(process.cwd(), '../../plugins');

    async onModuleInit() {
        await this.loadPlugins();
    }

    private async loadPlugins() {
        this.logger.log(`Scanning for plugins in ${this.pluginsDir}...`);

        if (!fs.existsSync(this.pluginsDir)) {
            this.logger.warn('Plugins directory not found.');
            return;
        }

        const pluginFolders = fs.readdirSync(this.pluginsDir);

        for (const folder of pluginFolders) {
            const pluginPath = path.join(this.pluginsDir, folder);
            if (fs.statSync(pluginPath).isDirectory()) {
                await this.loadPlugin(pluginPath);
            }
        }
    }

    private async loadPlugin(pluginPath: string) {
        try {
            const manifestPath = path.join(pluginPath, 'package.json');
            if (!fs.existsSync(manifestPath)) return;

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const mainFile = path.join(pluginPath, manifest.main || 'dist/index.js');

            if (!fs.existsSync(mainFile)) {
                this.logger.error(`Plugin entry point not found for ${manifest.name}`);
                return;
            }

            // Dynamic import usage
            const module = await import(mainFile);
            const PluginClass = module.default;

            if (!PluginClass) {
                this.logger.error(`Plugin ${manifest.name} has no default export.`);
                return;
            }

            const instance = new PluginClass() as CinetronPlugin;

            const context: PluginContext = {
                registerHook: (hook, callback) => {
                    this.logger.log(`Plugin ${manifest.name} registered hook: ${hook}`);
                },
                getLogger: () => new Logger(manifest.name),
            };

            await instance.onLoad(context);

            this.plugins.set(manifest.name, { manifest, instance });
            this.logger.log(`Plugin loaded: ${manifest.name} v${manifest.version}`);

        } catch (error) {
            this.logger.error(`Failed to load plugin at ${pluginPath}:`, error);
        }
    }
}
