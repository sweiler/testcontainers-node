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
const node_duration_1 = require("node-duration");
const container_state_1 = require("./container-state");
const docker_client_factory_1 = require("./docker-client-factory");
const logger_1 = __importDefault(require("./logger"));
const port_binder_1 = require("./port-binder");
const port_check_1 = require("./port-check");
const repo_tag_1 = require("./repo-tag");
const test_container_1 = require("./test-container");
const uuid_1 = require("./uuid");
const wait_strategy_1 = require("./wait-strategy");
class GenericContainerBuilder {
    constructor(context, uuid = new uuid_1.RandomUuid(), dockerClientFactory = new docker_client_factory_1.DockerodeClientFactory()) {
        this.context = context;
        this.uuid = uuid;
        this.dockerClientFactory = dockerClientFactory;
        this.buildArgs = {};
    }
    withBuildArg(key, value) {
        this.buildArgs[key] = value;
        return this;
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            const image = this.uuid.nextUuid();
            const tag = this.uuid.nextUuid();
            const repoTag = new repo_tag_1.RepoTag(image, tag);
            const dockerClient = this.dockerClientFactory.getClient();
            yield dockerClient.buildImage(repoTag, this.context, this.buildArgs);
            const container = new GenericContainer(image, tag, this.dockerClientFactory);
            if (!(yield container.hasRepoTagLocally())) {
                throw new Error("Failed to build image");
            }
            return Promise.resolve(container);
        });
    }
}
exports.GenericContainerBuilder = GenericContainerBuilder;
class GenericContainer {
    constructor(image, tag = "latest", dockerClientFactory = new docker_client_factory_1.DockerodeClientFactory()) {
        this.image = image;
        this.tag = tag;
        this.dockerClientFactory = dockerClientFactory;
        this.env = {};
        this.ports = [];
        this.cmd = [];
        this.bindMounts = [];
        this.tmpFs = {};
        this.startupTimeout = new node_duration_1.Duration(60000, node_duration_1.TemporalUnit.MILLISECONDS);
        this.repoTag = new repo_tag_1.RepoTag(image, tag);
        this.dockerClient = dockerClientFactory.getClient();
    }
    static fromDockerfile(context) {
        return new GenericContainerBuilder(context);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.hasRepoTagLocally())) {
                yield this.dockerClient.pull(this.repoTag);
            }
            const boundPorts = yield new port_binder_1.PortBinder().bind(this.ports);
            const container = yield this.dockerClient.create({
                repoTag: this.repoTag,
                env: this.env,
                cmd: this.cmd,
                bindMounts: this.bindMounts,
                tmpFs: this.tmpFs,
                boundPorts,
                name: this.name,
                networkMode: this.networkMode,
                healthCheck: this.healthCheck,
                additionalHostConfig: this.additionalHostConfig
            });
            yield this.dockerClient.start(container);
            const inspectResult = yield container.inspect();
            const containerState = new container_state_1.ContainerState(inspectResult);
            yield this.waitForContainer(container, containerState, boundPorts);
            return new StartedGenericContainer(container, this.dockerClient.getHost(), boundPorts, inspectResult.name, this.dockerClient);
        });
    }
    withCmd(cmd) {
        this.cmd = cmd;
        return this;
    }
    withName(name) {
        this.name = name;
        return this;
    }
    withEnv(key, value) {
        this.env[key] = value;
        return this;
    }
    withTmpFs(tmpFs) {
        this.tmpFs = tmpFs;
        return this;
    }
    withNetworkMode(networkMode) {
        this.networkMode = networkMode;
        return this;
    }
    withExposedPorts(...ports) {
        this.ports = ports;
        return this;
    }
    withBindMount(source, target, bindMode = "rw") {
        this.bindMounts.push({ source, target, bindMode });
        return this;
    }
    withHealthCheck(healthCheck) {
        this.healthCheck = healthCheck;
        return this;
    }
    withStartupTimeout(startupTimeout) {
        this.startupTimeout = startupTimeout;
        return this;
    }
    withWaitStrategy(waitStrategy) {
        this.waitStrategy = waitStrategy;
        return this;
    }
    withAdditionalHostConfig(additionalHostConfig) {
        this.additionalHostConfig = additionalHostConfig;
        return this;
    }
    hasRepoTagLocally() {
        return __awaiter(this, void 0, void 0, function* () {
            const repoTags = yield this.dockerClient.fetchRepoTags();
            return repoTags.some(repoTag => repoTag.equals(this.repoTag));
        });
    }
    waitForContainer(container, containerState, boundPorts) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.debug("Waiting for container to be ready");
            const waitStrategy = this.getWaitStrategy(container);
            yield waitStrategy.withStartupTimeout(this.startupTimeout).waitUntilReady(container, containerState, boundPorts);
            logger_1.default.debug("Container is ready");
        });
    }
    getWaitStrategy(container) {
        if (this.waitStrategy) {
            return this.waitStrategy;
        }
        const hostPortCheck = new port_check_1.HostPortCheck(this.dockerClient.getHost());
        const internalPortCheck = new port_check_1.InternalPortCheck(container, this.dockerClient);
        return new wait_strategy_1.HostPortWaitStrategy(this.dockerClient, hostPortCheck, internalPortCheck);
    }
}
exports.GenericContainer = GenericContainer;
class StartedGenericContainer {
    constructor(container, host, boundPorts, name, dockerClient) {
        this.container = container;
        this.host = host;
        this.boundPorts = boundPorts;
        this.name = name;
        this.dockerClient = dockerClient;
    }
    stop(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolvedOptions = Object.assign({}, test_container_1.DEFAULT_STOP_OPTIONS, options);
            yield this.container.stop({ timeout: resolvedOptions.timeout });
            yield this.container.remove({ removeVolumes: resolvedOptions.removeVolumes });
            return new StoppedGenericContainer();
        });
    }
    getContainerIpAddress() {
        return this.host;
    }
    getMappedPort(port) {
        return this.boundPorts.getBinding(port);
    }
    getId() {
        return this.container.getId();
    }
    getName() {
        return this.name;
    }
    exec(command) {
        return this.dockerClient.exec(this.container, command);
    }
}
class StoppedGenericContainer {
}
