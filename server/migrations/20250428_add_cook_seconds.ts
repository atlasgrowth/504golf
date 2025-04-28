import { pgTable, integer } from "drizzle-orm/pg-core";
import { menuItems } from "../../shared/schema";

export default async function(db: any) {
  await db.schema.alterTable(menuItems).addColumn("cook_seconds", integer("cook_seconds").default(300)).execute();
}