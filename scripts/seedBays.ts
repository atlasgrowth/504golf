import { db } from '../server/db';
import { bays } from '../shared/schema';

async function seedBays() {
  console.log('Seeding bays...');
  
  try {
    // Get existing bays
    const existingBays = await db.select().from(bays);
    
    if (existingBays.length > 0) {
      console.log(`Found ${existingBays.length} existing bays, skipping seed`);
      return;
    }
    
    // Create bays for all 3 floors (1-3)
    // Each floor has approximately 33-34 bays
    const baysToInsert = [];
    
    for (let floor = 1; floor <= 3; floor++) {
      const baysPerFloor = floor === 3 ? 34 : 33; // Last floor has 34 bays
      const startId = (floor - 1) * 33 + 1;
      
      for (let i = 0; i < baysPerFloor; i++) {
        const bayId = startId + i;
        baysToInsert.push({
          id: bayId,
          number: bayId,
          floor: floor,
          status: 'empty',
        });
      }
    }
    
    // Insert all bays
    const result = await db.insert(bays).values(baysToInsert);
    console.log(`Successfully inserted ${baysToInsert.length} bays`);
    
    return result;
  } catch (error) {
    console.error('Error seeding bays:', error);
    throw error;
  }
}

// Run if directly executed
// Check if this module is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedBays()
    .then(() => {
      console.log('Bays seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed bays:', error);
      process.exit(1);
    });
}

export { seedBays };