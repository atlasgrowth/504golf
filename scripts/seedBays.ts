import { db } from "../server/db";
import { bays } from "../shared/schema";

(async () => {
  await db.delete(bays);
  const data = Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    number: i + 1,
    floor: i < 10 ? 1 : i < 20 ? 2 : 3,
    status: "empty"
  }));
  await db.insert(bays).values(data);
  console.log("Seeded bays");
})();