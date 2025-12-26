"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Package, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  inventoryItemFormSchema,
  type InventoryItemFormData,
  ITEM_CATEGORIES,
  ITEM_UNITS,
} from "@/lib/validations/inventory";
import { InventoryItem } from "./ItemCard";

interface AddEditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  location?: "fridge" | "freezer" | "pantry";
  onSubmit: (data: InventoryItemFormData) => Promise<void>;
}

// Location emojis
const locationEmojis: Record<string, string> = {
  fridge: "🧊",
  freezer: "❄️",
  pantry: "🗄️",
};

export function AddEditItemModal({
  open,
  onOpenChange,
  item,
  location = "fridge",
  onSubmit,
}: AddEditItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "item",
      location: location,
      category: "",
      expirationDate: "",
      bestBeforeDate: "",
      purchaseDate: "",
      price: undefined,
      notes: "",
    },
  });

  // Reset form when modal opens with an item to edit
  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        category: item.category || "",
        expirationDate: item.expirationDate || "",
        bestBeforeDate: item.bestBeforeDate || "",
        purchaseDate: "",
        price: undefined,
        notes: item.notes || "",
      });
    } else if (open && !item) {
      // Reset to defaults for new item
      form.reset({
        name: "",
        quantity: 1,
        unit: "item",
        location: location,
        category: "",
        expirationDate: "",
        bestBeforeDate: "",
        purchaseDate: "",
        price: undefined,
        notes: "",
      });
    }
  }, [open, item, location, form]);

  const handleSubmit = async (data: InventoryItemFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationTitle = location.charAt(0).toUpperCase() + location.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[600px] max-h-[90vh] overflow-y-auto",
        "rounded-3xl border-2 border-gray-100",
        "bg-gradient-to-br from-white via-white to-primary-50/30",
        "shadow-playful-xl backdrop-blur-sm",
        "p-0"
      )}>
        {/* Header with gradient */}
        <div className={cn(
          "px-6 pt-6 pb-4",
          "bg-gradient-to-r from-primary-50 to-secondary-50",
          "border-b border-gray-100"
        )}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                "bg-white shadow-md"
              )}>
                <span className="text-2xl">
                  {item ? "✏️" : locationEmojis[location]}
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  {item ? "Edit Item" : `Add to ${locationTitle}`}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-0.5">
                  {item
                    ? "Update your item details below"
                    : "Fill in the details for your new item"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form content */}
        <div className="px-6 py-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {/* Item Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">
                      Item Name <span className="text-danger-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Organic Whole Milk"
                        className={cn(
                          "h-12 rounded-xl border-2 font-medium",
                          "focus:border-primary-400 focus:ring-primary-200",
                          "placeholder:text-gray-400"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-500" />
                  </FormItem>
                )}
              />

              {/* Quantity and Unit - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">
                        Quantity <span className="text-danger-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          className={cn(
                            "h-12 rounded-xl border-2 font-medium",
                            "focus:border-primary-400"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">
                        Unit <span className="text-danger-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 font-medium">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {ITEM_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit} className="rounded-lg">
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Location - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 font-medium">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {ITEM_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category} className="rounded-lg">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">
                        Location <span className="text-danger-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 font-medium">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2">
                          <SelectItem value="fridge" className="rounded-lg">
                            <span className="flex items-center gap-2">
                              <span>🧊</span> Fridge
                            </span>
                          </SelectItem>
                          <SelectItem value="freezer" className="rounded-lg">
                            <span className="flex items-center gap-2">
                              <span>❄️</span> Freezer
                            </span>
                          </SelectItem>
                          <SelectItem value="pantry" className="rounded-lg">
                            <span className="flex items-center gap-2">
                              <span>🗄️</span> Pantry
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates section with playful header */}
              <div className={cn(
                "p-4 rounded-2xl",
                "bg-gradient-to-r from-warning-50 to-accent-50",
                "border border-warning-100"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📅</span>
                  <span className="font-bold text-gray-700">Expiration Dates</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-bold text-gray-700">Use By Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 rounded-xl border-2 font-medium text-left justify-start",
                                  !field.value && "text-gray-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl border-2" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                              }}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              className="rounded-xl"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs text-gray-500">
                          Hard expiration date
                        </FormDescription>
                        <FormMessage className="text-danger-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bestBeforeDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-bold text-gray-700">Best Before</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 rounded-xl border-2 font-medium text-left justify-start",
                                  !field.value && "text-gray-400"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl border-2" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                              }}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              className="rounded-xl"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs text-gray-500">
                          Best quality before
                        </FormDescription>
                        <FormMessage className="text-danger-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Purchase Date and Price - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-bold text-gray-700">Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 rounded-xl border-2 font-medium text-left justify-start",
                                !field.value && "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl border-2" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                            disabled={(date) =>
                              date > new Date()
                            }
                            initialFocus
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-gray-700">Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2",
                            "text-gray-500 font-bold"
                          )}>
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="5.99"
                            className={cn(
                              "h-12 pl-8 rounded-xl border-2 font-medium",
                              "focus:border-primary-400"
                            )}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value ?? ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-danger-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-gray-700">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        className={cn(
                          "rounded-xl border-2 font-medium resize-none",
                          "focus:border-primary-400",
                          "placeholder:text-gray-400"
                        )}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-danger-500" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Footer with action buttons */}
        <DialogFooter className={cn(
          "px-6 py-4",
          "bg-gray-50 border-t border-gray-100",
          "rounded-b-3xl"
        )}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={cn(
              "h-12 px-6 rounded-xl border-2 font-bold",
              "hover:bg-gray-100 transition-all"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className={cn(
              "h-12 px-6 rounded-xl font-bold",
              "bg-primary-500 hover:bg-primary-600 text-white",
              "shadow-lg shadow-primary-500/30",
              "hover:shadow-xl transition-all duration-200"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            ) : item ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Update Item
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Save Item
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
