import fs from "fs";
import { parse } from "csv-parse/lib/sync";
import { db } from "../server/db";
import { menuItems } from "../shared/schema";

async function main() {
  const csv = fs.readFileSync("creole_tavern_full_menu_square.csv", "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true });

  await db.transaction(async (tx) => {
    await tx.delete(menuItems).execute();
    for (const r of rows) {
      await tx.insert(menuItems).values({
        square_id: r.Name,                             // temp unique key
        name: r.Name,
        price_cents: Math.round(parseFloat(r.Price) * 100),
        category: r.Category,
        station: "Kitchen",                            // Default station
        prep_seconds: 300,                            // Default prep time
        description: r.Description || null,
        image_url: null,
        active: true,
      });
    }
  });

  console.log(`Seeded ${rows.length} menu items`);
}

main().catch(console.error);