/**
 * Square Catalog Sync Job
 *
 * This job synchronizes the Square catalog with our local database.
 * It retrieves items from Square and updates our menu_items table.
 */

import { catalogApi } from "../integrations/square";
import { db } from "../db";
import { menuItems } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function syncCatalog() {
  console.log("Starting Square catalog sync job...");

  try {
    // Check if catalogApi is null (we're in stub mode)
    if (!catalogApi) {
      console.log("Running in stub mode - skipping Square catalog sync");
      return;
    }
    
    // Fetch catalog items from Square
    console.log("Requesting catalog items from Square API...");
    const resp = await catalogApi.listCatalog({
      types: ["ITEM", "ITEM_VARIATION", "CATEGORY"],
    });
    const catalogObjects = resp.result.objects || [];
    console.log(`Retrieved ${catalogObjects.length} catalog objects from Square API`);

    if (catalogObjects.length === 0) {
      console.log("No catalog objects returned from Square API");
      return;
    }

    // Map categories by ID
    const categories = Object.fromEntries(
      catalogObjects
        .filter((o: any) => o.type === "CATEGORY")
        .map((c: any) => [c.id, c.categoryData?.name ?? ""])
    );
    console.log(`Found ${Object.keys(categories).length} categories`);

    // Build rows for ITEM_VARIATION objects
    const rows = catalogObjects
      .filter((o: any) => o.type === "ITEM_VARIATION")
      .map((v: any) => {
        const itemId = v.itemVariationData?.itemId;
        const itemObj = catalogObjects.find((o: any) => o.id === itemId);
        const categoryId = itemObj?.itemData?.categoryId;

        return {
          square_id: v.id,
          name: v.itemVariationData?.name ?? "",
          price_cents: v.itemVariationData?.priceMoney?.amount ?? 0,
          category: categories[categoryId ?? ""] || "Misc",
          station: "Kitchen",
          prep_seconds: 300,
          description: itemObj?.itemData?.description ?? null,
          image_url: itemObj?.itemData?.imageUrl ?? null,
          active: true,
        };
      });
    console.log(`Processed ${rows.length} menu items to update`);

    // Upsert into the database
    for (const row of rows) {
      const existing = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.square_id, row.square_id));

      if (existing.length) {
        await db
          .update(menuItems)
          .set(row)
          .where(eq(menuItems.square_id, row.square_id));
      } else {
        await db.insert(menuItems).values(row);
      }
    }

    console.log("Square catalog sync completed successfully");
  } catch (error) {
    console.error("Error syncing Square catalog:", error);
    throw error;
  }
}

// Run immediately if executed directly
if (import.meta.url.endsWith("syncSquareCatalog.ts")) {
  syncCatalog()
    .then(() => {
      console.log("Catalog sync completed");
      process.exit(0);
    })
    .catch(() => process.exit(1));
}
