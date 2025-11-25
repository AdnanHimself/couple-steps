import { registerRootComponent } from 'expo';

import App from './App';
import { Logger } from './src/utils/Logger';

// Global Error Handler to catch fatal JS crashes
const defaultHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    Logger.error('FATAL GLOBAL ERROR:', error);
    // Give it a moment to persist logs
    setTimeout(() => {
        defaultHandler(error, isFatal);
    }, 500);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
