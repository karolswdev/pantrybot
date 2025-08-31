import InventoryPage from "../InventoryPage";

const FREEZER_CATEGORIES = ["Meat", "Vegetables", "Prepared Meals", "Desserts", "Seafood"];

export default function FreezerInventoryPage() {
  return <InventoryPage location="freezer" categories={FREEZER_CATEGORIES} />;
}