import { createTRPCRouter, publicProcedure } from "../trpc";

export const helloRouter = createTRPCRouter({
	hello: publicProcedure.query(() => {
		return { greetings: "Hello from tRPC!" };
	}),
});
