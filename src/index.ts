import { Router, Listener } from "./Http"

Router
.from(new Listener)
.with("/status", async function *() {
	yield { statusCode: 200, statusMessage: "OK" }
	yield JSON.stringify({ status: "OK" })
	yield "\n"
})
.with("*", async function *() {
	yield { statusCode: 404, statusMessage: "Not Found" }
})
.pipe()