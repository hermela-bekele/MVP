// The installed socket.io-client build in this environment ships without its
// bundled .d.ts files, so TypeScript can't resolve types for it. This is a
// minimal shim covering the subset of the API this codebase actually uses.
declare module 'socket.io-client' {
  export interface Socket {
    connected: boolean;
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(event: string, listener?: (...args: any[]) => void): this;
    emit(event: string, ...args: unknown[]): this;
    disconnect(): this;
    connect(): this;
  }

  export interface SocketOptions {
    path?: string;
    transports?: string[];
    auth?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export function io(uri?: string, opts?: SocketOptions): Socket;
  export function io(opts?: SocketOptions): Socket;
}
