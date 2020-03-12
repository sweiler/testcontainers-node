"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
class DebugLogger {
    constructor() {
        this.logger = debug_1.default("testcontainers");
    }
    debug(message) {
        this.logger(`DEBUG: ${message}`);
    }
    info(message) {
        this.logger(`INFO: ${message}`);
    }
    warn(message) {
        this.logger(`WARN: ${message}`);
    }
    error(message) {
        this.logger(`ERROR: ${message}`);
    }
}
exports.default = new DebugLogger();
