import * as http from "http"
import * as net from "net"
import * as process from "process"
import { isUint8Array } from "util/types"

export interface ListenerEvent {
	name: string
	source: Listener
}
export interface ListeningEvent extends ListenerEvent {
	name: "listening"
	source: Listener
}
export type Head = { statusCode: number, statusMessage?: string }
export type Body = string | Buffer | Uint8Array
export type ResponseMessage = Head | Body
export type RequestHandler = (this: RequestMessage) => AsyncIterable<ResponseMessage>
export interface RequestMessage {
	method: string
	path: string
}
export interface RequestEvent extends ListenerEvent, RequestMessage {
	name: "request"
	source: Listener
	reply(handler: RequestHandler): void
}
export type RequestPredicate = (req: RequestMessage) => boolean

export function isRequestEvent(v: any): v is RequestEvent { return typeof v == "object" && v.name && typeof v.name == "string" && v.name == "request" }
export function isHead(v: any): v is Head { return typeof v == "object" && v.statusCode && typeof v.statusCode == "number" }
export function isBody(v: any): v is Body { return typeof v == "string" || isUint8Array(v) || Buffer.isBuffer(v) }

export interface ListenerOptions {
	server?: http.Server
	port?: number
}

/**
 * Implementation of an event-based HTTP-protocol listener
 */
export class Listener implements AsyncIterable<ListenerEvent> {
	private server: http.Server
	private options: net.ListenOptions
	constructor(options: ListenerOptions = {}) {
		this.server = options.server || http.createServer()
		this.options = { port: options.port || (process.env.port ? parseInt(process.env.port) : 8080) }
	}
	async *[Symbol.asyncIterator]() {
		while (!this.server.listening) {
			yield await new Promise<ListeningEvent>(resolve =>
				this.server.once("listening", () =>
					resolve({
						name: "listening",
						source: this
					})
				)
				.listen(this.options)
			)
		}
		while (this.server.listening) {
			yield await new Promise<RequestEvent>(resolve =>
				this.server.once("request", (req, res) =>
					resolve({
						name: "request",
						source: this,
						method: req.method!,
						path: req.url!,
						async reply(handler) {
							for await (const message of handler.apply(this as RequestMessage)) {
								if (isHead(message)) res.writeHead(message.statusCode, message.statusMessage)
								if (isBody(message)) res.write(message)
							}
							res.end()
						}
					})
				)
			)
		}
	}
}

/**
 * Implementation of an extensible HTTP-protocol router
 */
export class Router {
	private constructor(readonly source?: AsyncIterable<ListenerEvent>, readonly routes: ReadonlyMap<RequestPredicate, RequestHandler> = new Map<RequestPredicate, RequestHandler>()) { }
	static from(source: AsyncIterable<ListenerEvent>) { return new Router(source) }
	async pipe() { for await (const e of this); }
	with(filter: string | RequestPredicate, handler: RequestHandler) {
		let predicate = typeof filter == "string"
			? (req: RequestMessage) => req.method == "GET" && (filter == "*" || filter == req.path)
			: filter
		return new Router(this.source, new Map([...this.routes.entries(), [predicate, handler]]))
	}
	async *[Symbol.asyncIterator]() {
		for await (const e of this.source!) {
			if (isRequestEvent(e)) {
				for (const [filter, handler] of this.routes) {
					if (filter(e)) {
						e.reply(handler)
						break
					}
				}
			}
		}
	}
}