"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bound_ports_1 = require("./bound-ports");
const port_client_1 = require("./port-client");
class PortBinder {
    constructor(portClient = new port_client_1.RandomPortClient()) {
        this.portClient = portClient;
    }
    bind(ports) {
        return __awaiter(this, void 0, void 0, function* () {
            const boundPorts = new bound_ports_1.BoundPorts();
            for (const port of ports) {
                boundPorts.setBinding(port, yield this.portClient.getPort());
            }
            return boundPorts;
        });
    }
}
exports.PortBinder = PortBinder;
