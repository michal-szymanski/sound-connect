import { HonoContext } from "types";
import { createAuth } from "auth";
import { Context, Next } from "hono";
import { createLocalJWKSet, jwtVerify } from "jose";
import { z } from "zod";

const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  username: z.string(),
  createdAt: z
    .union([z.string(), z.number()])
    .transform((val) => new Date(val)),
  updatedAt: z
    .union([z.string(), z.number()])
    .transform((val) => new Date(val)),
});

export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
  const auth = createAuth({
    queue: c.env.NotificationsQueue,
    apiUrl: c.env.API_URL,
    clientUrl: c.env.CLIENT_URL,
    secret: c.env.BETTER_AUTH_SECRET,
  });

  if (
    c.req.path.startsWith("/api/auth/") ||
    c.req.path.startsWith("/debug") ||
    c.req.path === "/health" ||
    c.req.path === "/api/users/username/check" ||
    (c.req.path.match(/^\/bands\/\d+$/) && c.req.method === "GET") ||
    (c.req.path.match(/^\/users\/[^/]+\/bands$/) && c.req.method === "GET")
  ) {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set("user", session.user);
    }

    return next();
  }

  const upgradeHeader = c.req.header("Upgrade");
  const isWebSocket = upgradeHeader?.toLowerCase() === "websocket";

  if (isWebSocket) {
    const protocols = c.req.header("sec-websocket-protocol");

    if (protocols) {
      const protocolList = protocols.split(",").map((p) => p.trim());

      if (protocolList[0] === "access_token" && protocolList[1]) {
        const token = decodeURIComponent(protocolList[1]);

        try {
          const jwks = await auth.api.getJwks();
          const JWKS = createLocalJWKSet(jwks);

          const { payload } = await jwtVerify(token, JWKS);

          const parsedPayload = jwtPayloadSchema.parse(payload);

          c.set("user", {
            id: parsedPayload.sub,
            email: parsedPayload.email,
            name: parsedPayload.name,
            emailVerified: parsedPayload.emailVerified,
            image: parsedPayload.image,
            username: parsedPayload.username,
            createdAt: parsedPayload.createdAt,
            updatedAt: parsedPayload.updatedAt,
            lastActiveAt: new Date().toISOString(),
          });

          return next();
        } catch (error) {
          console.error("[Auth Middleware] JWT verification failed:", error);
          if (error instanceof z.ZodError) {
            console.error(
              "[Auth Middleware] Zod validation errors:",
              z.treeifyError(error),
            );
          }
          return c.json({ message: "Unauthorized" }, 401);
        }
      }
    }
    return c.json({ message: "Unauthorized" }, 401);
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("user", session.user);

  return next();
};
