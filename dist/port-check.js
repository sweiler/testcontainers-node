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
const net_1 = require("net");
class HostPortCheck {
    constructor(host) {
        this.host = host;
    }
    isBound(port) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const socket = new net_1.Socket();
                socket
                    .setTimeout(1000)
                    .on("error", () => {
                    socket.destroy();
                    resolve(false);
                })
                    .on("timeout", () => {
                    socket.destroy();
                    resolve(false);
                })
                    .connect(port, this.host, () => {
                    socket.end();
                    resolve(true);
                });
            });
        });
    }
}
exports.HostPortCheck = HostPortCheck;
class InternalPortCheck {
    constructor(container, dockerClient) {
        this.container = container;
        this.dockerClient = dockerClient;
    }
    isBound(port) {
        return __awaiter(this, void 0, void 0, function* () {
            const portHex = port.toString(16).padStart(4, "0");
            const commands = [
                ["/bin/sh", "-c", `cat /proc/net/tcp{,6} | awk '{print $2}' | grep -i :${portHex}`],
                ["/bin/sh", "-c", `nc -vz -w 1 localhost ${port}`],
                ["/bin/bash", "-c", `</dev/tcp/localhost/${port}`]
            ];
            const commandResults = yield Promise.all(commands.map(command => this.dockerClient.exec(this.container, command)));
            return commandResults.some(result => result.exitCode === 0);
        });
    }
}
exports.InternalPortCheck = InternalPortCheck;
