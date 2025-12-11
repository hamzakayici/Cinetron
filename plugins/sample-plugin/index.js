const { Logger } = require('@nestjs/common');

class SamplePlugin {
    async onLoad(context) {
        const logger = context.getLogger();
        logger.log('Hello from Sample Plugin!');

        context.registerHook('onMediaAdded', (media) => {
            logger.log(`Processing media: ${media.title}`);
        });
    }

    async onUnload() {
        console.log('Sample Plugin unloaded');
    }
}

module.exports = SamplePlugin;
