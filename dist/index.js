"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
const server = http_1.default.createServer(app);
// Build the correct path to history.json inside dist/data
const filePath = path_1.default.resolve(__dirname, '..', 'data', 'history.json'); // Adjust if needed based on actual folder structure
console.log('Looking for file at:', filePath);
try {
    const jsonData = fs_1.default.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    console.log(data);
}
catch (err) {
    console.error('Error reading the file:', err);
}
app.get('/data', (req, res) => {
    const filePath = path_1.default.join(__dirname, './data/history.json');
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).json({ error: 'Failed to load data' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        }
        catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});
app.get('/data/*', (req, res) => {
    const filePath = path_1.default.join(__dirname, './data/history.json');
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).json({ error: 'Failed to load data' });
        }
        try {
            const jsonData = JSON.parse(data);
            // Extract the dynamic path after `/data/`
            const subPath = req.params[0]; // Gets everything after `/data/`
            const keys = subPath.split('/'); // Split path into keys
            // Navigate through the JSON using the keys
            let result = jsonData;
            for (const key of keys) {
                if (result[key] === undefined) {
                    return res.status(404).json({ error: 'Path not found in JSON' });
                }
                result = result[key];
            }
            res.json(result);
        }
        catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});
server.listen(process.env.PORT);
//# sourceMappingURL=index.js.map