/**
 * Simple structured logger with color-coded output.
 * Keeps console output clean and scannable during development.
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

const logger = {
  info(context, message, data = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.blue}INFO${COLORS.reset} ${COLORS.cyan}[${context}]${COLORS.reset}`;
    console.log(`${prefix} ${message}`, data ? data : '');
  },

  success(context, message, data = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.green}✓${COLORS.reset} ${COLORS.cyan}[${context}]${COLORS.reset}`;
    console.log(`${prefix} ${message}`, data ? data : '');
  },

  warn(context, message, data = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.yellow}WARN${COLORS.reset} ${COLORS.cyan}[${context}]${COLORS.reset}`;
    console.warn(`${prefix} ${message}`, data ? data : '');
  },

  error(context, message, error = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.red}ERROR${COLORS.reset} ${COLORS.cyan}[${context}]${COLORS.reset}`;
    console.error(`${prefix} ${message}`);
    if (error?.stack) console.error(`${COLORS.dim}${error.stack}${COLORS.reset}`);
  },

  scrape(message, data = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.magenta}🔍 SCRAPE${COLORS.reset}`;
    console.log(`${prefix} ${message}`, data ? data : '');
  },

  alert(message, data = null) {
    const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${COLORS.green}🔔 ALERT${COLORS.reset}`;
    console.log(`${prefix} ${message}`, data ? data : '');
  },
};

export default logger;
