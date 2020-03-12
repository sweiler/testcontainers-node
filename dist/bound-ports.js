"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BoundPorts {
    constructor() {
        this.ports = new Map();
    }
    getBinding(port) {
        const binding = this.ports.get(port);
        if (!binding) {
            throw new Error(`No port binding found for :${port}`);
        }
        return binding;
    }
    setBinding(key, value) {
        this.ports.set(key, value);
    }
    iterator() {
        return this.ports;
    }
}
exports.BoundPorts = BoundPorts;
