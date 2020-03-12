import { DockerClient } from "./docker-client";
export declare type Host = string;
export interface DockerClientFactory {
  getClient(): DockerClient;
  getHost(): Host;
}
export declare class DockerodeClientFactory implements DockerClientFactory {
  private readonly host;
  private readonly client;
  constructor();
  getClient(): DockerClient;
  getHost(): Host;
  private fromDefaults;
  private fromDockerHost;
  private fromDockerWormhole;
}
