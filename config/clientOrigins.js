const DEFAULT_CLIENT_URL = 'http://localhost:3000';
const ADMIN_SOCKET_URL = 'https://admin.socket.io';

function parseOrigins(value) {
    if (!value) return [];
    return value
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}

function getClientOrigins(options = {}) {
    const origins = parseOrigins(process.env.CLIENT_URLS || process.env.CLIENT_URL);
    const clientOrigins = origins.length > 0 ? origins : [DEFAULT_CLIENT_URL];

    if (options.includeAdmin && !clientOrigins.includes(ADMIN_SOCKET_URL)) {
        return [...clientOrigins, ADMIN_SOCKET_URL];
    }

    return clientOrigins;
}

module.exports = {
    getClientOrigins,
};
