"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_gateway_1 = __importDefault(require("default-gateway"));
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const url_1 = __importDefault(require("url"));
const docker_client_1 = require("./docker-client");
const logger_1 = __importDefault(require("./logger"));
class DockerodeClientFactory {
    constructor() {
        if (process.env.DOCKER_HOST) {
            const { host, client } = this.fromDockerHost(process.env.DOCKER_HOST);
            this.host = host;
            this.client = client;
        }
        else if (process.env.CODEBUILD_BUILD_NUMBER) {
            const { host, client } = this.fromDefaults();
            this.host = host;
            this.client = client;
        }
        else if (fs_1.default.existsSync("/.dockerenv")) {
            const { host, client } = this.fromDockerWormhole();
            this.host = host;
            this.client = client;
        }
        else {
            const { host, client } = this.fromDefaults();
            this.host = host;
            this.client = client;
        }
    }
    getClient() {
        return this.client;
    }
    getHost() {
        return this.host;
    }
    fromDefaults() {
        logger_1.default.info("Using Docker defaults");
        const host = "localhost";
        const dockerode = new dockerode_1.default();
        const client = new docker_client_1.DockerodeClient(host, dockerode);
        return { host, client };
    }
    fromDockerHost(dockerHost) {
        logger_1.default.info(`Using Docker configuration from DOCKER_HOST: ${dockerHost}`);
        const { hostname: host, port } = url_1.default.parse(dockerHost);
        if (!host || !port) {
            throw new Error(`Invalid format for DOCKER_HOST, found: ${dockerHost}`);
        }
        const dockerode = new dockerode_1.default({ host, port });
        const client = new docker_client_1.DockerodeClient(host, dockerode);
        return { host, client };
    }
    fromDockerWormhole() {
        logger_1.default.info("Using Docker in Docker method");
        const { gateway } = default_gateway_1.default.v4.sync();
        const host = gateway;
        const dockerode = new dockerode_1.default();
        const client = new docker_client_1.DockerodeClient(host, dockerode);
        return { host, client };
    }
}
exports.DockerodeClientFactory = DockerodeClientFactory;
