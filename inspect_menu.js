const fs = require('fs');

try {
  const data = fs.readFileSync('menu_response.json', 'utf8');
  const menu = JSON.parse(data);
  
  // Check first few menu items
  for (let i = 0; i < Math.min(5, menu.length); i++) {
    const category = menu[i];
    console.log(`Category: ${category.category.name}`);
    
    for (let j = 0; j < Math.min(3, category.items.length); j++) {
      const item = category.items[j];
      console.log(`- Item: ${item.name}, price_cents: ${item.price_cents}, type: ${typeof item.price_cents}`);
    }
  }
} catch (error) {
  console.error('Error:', error);
}