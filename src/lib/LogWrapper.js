const { createLogger, format, transports } = require('winston');
const _ = require('lodash');

const stack = format((log) => {
    const info = log;
    if (info.stack) {
        info.message += info.stack.replace(
            _.first(info.stack.split(info.message)) + info.message,
            ` ${JSON.stringify({ timestamp: info.timestamp })}`,
        );

        delete info.stack;
        delete info.timestamp;
    }

    return info;
});

const LogWrapper = createLogger({
    level: 'verbose',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({
            stack: true,
        }),
        format.splat(),
        format.json(),
    ),
    transports: [
        new transports.File({
            tailable: true,
            maxFiles: 5,
            maxsize: 2e7,
            level: 'error',
            filename: './logs/error.log',
        }),
        new transports.File({
            tailable: true,
            maxFiles: 5,
            maxsize: 2e7,
            filename: './logs/combined.log',
        }),
        new transports.Console({
            level: 'debug',
            format: format.combine(stack(), format.colorize(), format.simple()),
        }),
    ],
});

LogWrapper.info('Logger is set');
module.exports = LogWrapper;
