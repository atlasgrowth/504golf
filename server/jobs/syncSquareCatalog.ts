/**
 * Square Catalog Sync Job
 * 
 * This job synchronizes the Square catalog with our local database.
 * It retrieves items from Square and updates our menu_items table.
 */
import { catalog } from "../integrations/square";
import { db } from "../db";
import { menuItems } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function syncCatalog() {
  console.log("Starting Square catalog sync job...");
  
  try {
    // Fetch catalog items from Square
    console.log("Requesting catalog items from Square API...");
    
    const response = await catalog.list({
      types: "ITEM,ITEM_VARIATION,CATEGORY"
    });
    
    // Square SDK returns a Page, we need to access the data
    const catalogObjects = [];
    let page = response;
    
    // Process the first page
    if (page && page.data) {
      catalogObjects.push(...page.data);
    }
    
    // Fetch additional pages if there are more
    while (page && page.hasNextPage()) {
      page = await page.getNextPage();
      if (page && page.data) {
        catalogObjects.push(...page.data);
      }
    }
    
    console.log(`Retrieved ${catalogObjects.length} catalog objects from initial Square API response`);
    
    if (!catalogObjects || catalogObjects.length === 0) {
      console.log("No catalog objects returned from Square API");
      return;
    }
    
    const objects = catalogObjects;
    
    console.log(`Retrieved ${objects.length} catalog objects from Square`);
    
    // Extract categories for easy reference
    const categories = Object.fromEntries(
      objects
        .filter((o: any) => o.type === "CATEGORY")
        .map((c: any) => [c.id, c.categoryData?.name])
    );
    
    console.log(`Found ${Object.keys(categories).length} categories`);
    
    // Process item variations
    const rows = objects
      .filter((o: any) => o.type === "ITEM_VARIATION")
      .map((v: any) => {
        const itemId = v.itemVariationData?.itemId;
        const itemObject = itemId ? objects.find((o: any) => o.id === itemId) : null;
        const categoryId = itemObject?.itemData?.categoryId;
        
        return {
          square_id: v.id,
          name: v.itemVariationData?.name ?? "",
          price_cents: v.itemVariationData?.priceMoney?.amount ?? 0,
          category: categories[categoryId ?? ""] ?? "Misc",
          // Use some default values for fields not in Square
          station: "Kitchen", // Default station
          prep_seconds: 300,   // Default prep time
          description: itemObject?.itemData?.description ?? null,
          image_url: itemObject?.itemData?.imageUrl ?? null,
          active: true
        };
      });
    
    console.log(`Processed ${rows.length} menu items to update`);
    
    // Update database with the synchronized items
    for (const row of rows) {
      // Check if the item exists by square_id
      const existingItem = await db.select()
        .from(menuItems)
        .where(eq(menuItems.square_id, row.square_id))
        .execute();
      
      if (existingItem.length > 0) {
        // Update existing item
        await db.update(menuItems)
          .set(row)
          .where(eq(menuItems.square_id, row.square_id))
          .execute();
      } else {
        // Insert new item
        await db.insert(menuItems)
          .values(row)
          .execute();
      }
    }
    
    console.log("Square catalog sync completed successfully");
  } catch (error) {
    console.error("Error syncing Square catalog:", error);
    throw error;
  }
}

// Run the sync directly if the file is executed
syncCatalog()
  .then(() => {
    console.log("Catalog sync completed");
    process.exit(0);
  })
  .catch(err => {
    console.error("Catalog sync failed:", err);
    process.exit(1);
  });