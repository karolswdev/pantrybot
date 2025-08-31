import InventoryPage from "../InventoryPage";

const FRIDGE_CATEGORIES = ["Dairy", "Produce", "Meat", "Beverages", "Condiments", "Leftovers"];

export default function FridgeInventoryPage() {
  return <InventoryPage location="fridge" categories={FRIDGE_CATEGORIES} />;
}