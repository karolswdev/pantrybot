import InventoryPage from "../InventoryPage";

const PANTRY_CATEGORIES = ["Grains", "Canned Goods", "Bakery", "Oils & Condiments", "Snacks", "Spices"];

export default function PantryInventoryPage() {
  return <InventoryPage location="pantry" categories={PANTRY_CATEGORIES} />;
}