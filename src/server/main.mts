import { DurableObject } from "cloudflare:workers";

export interface Env {
    COUNTER: DurableObjectNamespace<Counter>;
}

export class Counter extends DurableObject {
    async getCurrent(): Promise<number> {
        const state = await this.ctx.storage.get<number>("count");
        return state ?? 0;
    }

    async increment(): Promise<number> {
        const current = await this.getCurrent();
        const newValue = current + 1;
        await this.ctx.storage.put("count", newValue);
        return newValue;
    }
}

const headers = {
    "Content-Security-Policy": "default-src 'self'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Permissions-Policy": "",
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Cache-Control": "no-store",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/api/click") {
            const stub = env.COUNTER.getByName("Counter");
            if (request.method === "GET") {
                const current = await stub.getCurrent();
                return new Response(current.toString(), {
                    headers,
                    status: 200,
                });
            }
            if (request.method === "POST") {
                const newValue = await stub.increment();
                return new Response(newValue.toString(), {
                    headers,
                    status: 200,
                });
            }
            return new Response(null, {
                status: 405,
            });
        }

        return new Response(null, {
            status: 404,
        });
    }
} satisfies ExportedHandler<Env>;
