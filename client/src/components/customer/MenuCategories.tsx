import { useState } from "react";
import { cn } from "@/lib/utils";
import { Category } from "@shared/schema";
import { motion } from "framer-motion";
import { GaugeCircle, Pizza, Coffee, Beef, Salad, UtensilsCrossed } from "lucide-react";

interface MenuCategoriesProps {
  categories: Category[];
}

export default function MenuCategories({ categories }: MenuCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Map category names to icons
  const getCategoryIcon = (name: string) => {
    const normalizedName = name.toLowerCase();
    
    if (normalizedName.includes('dessert')) return <Coffee className="w-3 h-3" />;
    if (normalizedName.includes('burger') || normalizedName.includes('sandwich')) return <Beef className="w-3 h-3" />;
    if (normalizedName.includes('pizza') || normalizedName.includes('italian')) return <Pizza className="w-3 h-3" />;
    if (normalizedName.includes('salad') || normalizedName.includes('healthy')) return <Salad className="w-3 h-3" />;
    
    return <UtensilsCrossed className="w-3 h-3" />;
  };

  return (
    <div className="mb-4">
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
        <button 
          className={cn(
            "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shadow-sm",
            activeCategory === "all" 
              ? "bg-primary text-white shadow-md" 
              : "bg-white/70 backdrop-blur-sm border border-white/30 text-foreground hover:bg-white/90"
          )}
          onClick={() => setActiveCategory("all")}
        >
          <div className="flex items-center">
            <GaugeCircle className="w-3 h-3 mr-1.5" />
            All Items
          </div>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shadow-sm",
              activeCategory === category.slug 
                ? "bg-primary text-white shadow-md" 
                : "bg-white/70 backdrop-blur-sm border border-white/30 text-foreground hover:bg-white/90"
            )}
            onClick={() => setActiveCategory(category.slug)}
          >
            <div className="flex items-center">
              {getCategoryIcon(category.name)}
              <span className="ml-1.5">{category.name}</span>
            </div>
            
            {activeCategory === category.slug && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
