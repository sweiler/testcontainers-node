"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_duration_1 = require("node-duration");
exports.DEFAULT_STOP_OPTIONS = {
    timeout: new node_duration_1.Duration(10, node_duration_1.TemporalUnit.SECONDS),
    removeVolumes: true
};
