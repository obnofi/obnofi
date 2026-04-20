declare module "y-websocket/bin/utils" {
  export function setupWSConnection(
    socket: unknown,
    request: unknown,
    options?: { docName?: string }
  ): void;
}
