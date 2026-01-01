import { mergeRouters } from "~/server/api/trpc";
import { connectionRouter } from "./database/connection";
import { queryRouter } from "./database/query";
import { tabRouter } from "./database/tab";
import { tableRouter } from "./database/table";
import { tableConfigRouter } from "./database/table-config";

export const databaseRouter = mergeRouters(
	connectionRouter,
	tableRouter,
	queryRouter,
	tabRouter,
	tableConfigRouter,
);
