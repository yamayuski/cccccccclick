import { DurableObject } from "cloudflare:workers";

export interface Env {
    COUNTER: DurableObjectNamespace<Counter>;
}

const USER_ID_PREFIX = "user:";

export class Counter extends DurableObject {
    async getCurrent(): Promise<number> {
        const state = await this.ctx.storage.get<number>("count");
        return state ?? 0;
    }

    async getUniqueUserCount(): Promise<number> {
        const list = await this.ctx.storage.list<{ id: string }>({
            prefix: USER_ID_PREFIX,
            allowConcurrency: true,
        });
        return list.size;
    }

    async setUserId(id: string): Promise<void> {
        return this.ctx.storage.put(
            `${USER_ID_PREFIX}${id}`,
            true,
            {
                allowConcurrency: true,
                allowUnconfirmed: true,
            },
        );
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

async function tryGetUserId(request: Request): Promise<string | null> {
    try {
        const body: { id?: string } = await request.json();
        if ("id" in body && typeof body.id === "string") {
            return body.id;
        }
    } catch {
        // Ignore errors
    }
    return null;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/api/click") {
            const stub = env.COUNTER.getByName("Counter");
            const userCount = await stub.getUniqueUserCount();
            if (request.method === "GET") {
                const current = await stub.getCurrent();
                return new Response(JSON.stringify({
                    current,
                    userCount,
                }), {
                    headers,
                    status: 200,
                });
            }
            if (request.method === "POST") {
                const userId = await tryGetUserId(request);
                if (userId) {
                    await stub.setUserId(userId);
                }
                const current = await stub.increment();
                return new Response(JSON.stringify({
                    current,
                    userCount,
                }), {
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
