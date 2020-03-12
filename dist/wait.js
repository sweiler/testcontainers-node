"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wait_strategy_1 = require("./wait-strategy");
class Wait {
    static forLogMessage(message) {
        return new wait_strategy_1.LogWaitStrategy(message);
    }
    static forHealthCheck() {
        return new wait_strategy_1.HealthCheckWaitStrategy();
    }
}
exports.Wait = Wait;
