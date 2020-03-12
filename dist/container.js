"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const byline_1 = __importDefault(require("byline"));
const node_duration_1 = require("node-duration");
class DockerodeContainer {
    constructor(container) {
        this.container = container;
    }
    getId() {
        return this.container.id;
    }
    start() {
        return this.container.start();
    }
    stop(options) {
        return this.container.stop({
            t: options.timeout.get(node_duration_1.TemporalUnit.SECONDS)
        });
    }
    remove(options) {
        return this.container.remove({
            v: options.removeVolumes
        });
    }
    exec(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new DockerodeExec(yield this.container.exec({
                Cmd: options.cmd,
                AttachStdout: options.attachStdout,
                AttachStderr: options.attachStderr
            }));
        });
    }
    logs() {
        return new Promise((resolve, reject) => {
            const options = {
                follow: true,
                stdout: true,
                stderr: true
            };
            this.container.logs(options, (err, stream) => {
                if (err) {
                    reject(err);
                }
                else {
                    if (!stream) {
                        reject(new Error("Log stream is undefined"));
                    }
                    else {
                        resolve(byline_1.default(stream));
                    }
                }
            });
        });
    }
    inspect() {
        return __awaiter(this, void 0, void 0, function* () {
            const inspectResult = yield this.container.inspect();
            return {
                hostPorts: this.getHostPorts(inspectResult),
                internalPorts: this.getInternalPorts(inspectResult),
                name: this.getName(inspectResult),
                healthCheckStatus: this.getHealthCheckStatus(inspectResult)
            };
        });
    }
    getName(inspectInfo) {
        return inspectInfo.Name;
    }
    getInternalPorts(inspectInfo) {
        return Object.keys(inspectInfo.NetworkSettings.Ports).map(port => Number(port.split("/")[0]));
    }
    getHostPorts(inspectInfo) {
        return Object.values(inspectInfo.NetworkSettings.Ports)
            .filter(portsArray => portsArray !== null)
            .map(portsArray => Number(portsArray[0].HostPort));
    }
    getHealthCheckStatus(inspectResult) {
        const health = inspectResult.State.Health;
        if (health === undefined) {
            return "none";
        }
        else {
            return health.Status;
        }
    }
}
exports.DockerodeContainer = DockerodeContainer;
class DockerodeExec {
    constructor(exec) {
        this.exec = exec;
    }
    start() {
        return new Promise((resolve, reject) => {
            this.exec.start((err, stream) => {
                if (err) {
                    return reject(err);
                }
                return resolve(stream);
            });
        });
    }
    inspect() {
        return __awaiter(this, void 0, void 0, function* () {
            const inspectResult = yield this.exec.inspect();
            return { exitCode: inspectResult.ExitCode };
        });
    }
}
