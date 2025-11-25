type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class LoggerService {
    private isDev = __DEV__;

    private logs: string[] = [];
    private maxLogs = 100;

    constructor() {
        // No async loading
    }

    log(level: LogLevel, message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        // Safely stringify args to avoid circular reference crashes
        const safeArgs = args.map(a => {
            try {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
            } catch (e) {
                return '[Circular/Error]';
            }
        });

        const formattedMessage = `${prefix} ${message} ${safeArgs.join(' ')}`;

        // Store in memory
        this.logs.unshift(formattedMessage);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        if (!this.isDev) return;

        switch (level) {
            case 'info':
                console.log(prefix, message, ...args);
                break;
            case 'warn':
                console.warn(prefix, message, ...args);
                break;
            case 'error':
                console.error(prefix, message, ...args);
                break;
            case 'debug':
                console.debug(prefix, message, ...args);
                break;
        }
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }

    info(message: string, ...args: any[]) {
        this.log('info', message, ...args);
    }

    warn(message: string, ...args: any[]) {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: any[]) {
        this.log('error', message, ...args);
    }

    debug(message: string, ...args: any[]) {
        this.log('debug', message, ...args);
    }
}

export const Logger = new LoggerService();
