import fs from "fs";
import { parse } from "csv-parse/sync";
import { db } from "../server/db";
import { menuItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const csv = fs.readFileSync("creole_tavern_full_menu_square.csv", "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true });
  
  console.log(`Processing ${rows.length} menu items from CSV`);

  // Get existing items to check if they need updating
  const existingItems = await db.select().from(menuItems);
  const existingItemsMap = new Map(
    existingItems.map(item => [item.name, item])
  );
  
  // Process each CSV row
  let inserted = 0;
  let updated = 0;
  
  for (const r of rows) {
    const itemName = r.Name;
    const itemData = {
      square_id: `CSV_${itemName.replace(/\s+/g, '_')}`,  // Generate consistent ID
      name: itemName,
      price_cents: Math.round(parseFloat(r.Price) * 100),
      category: r.Category,
      station: "Kitchen",                            // Default station
      prep_seconds: 300,                            // Default prep time
      description: r.Description || null,
      image_url: null,
      active: true,
    };
    
    const existingItem = existingItemsMap.get(itemName);
    
    if (existingItem) {
      // Update existing item
      await db.update(menuItems)
        .set(itemData)
        .where(eq(menuItems.name, itemName))
        .execute();
      updated++;
    } else {
      // Insert new item
      await db.insert(menuItems).values(itemData);
      inserted++;
    }
  }
  
  console.log(`Menu items processed: ${inserted} inserted, ${updated} updated`);

  console.log(`Seeded ${rows.length} menu items`);
}

main().catch(console.error);