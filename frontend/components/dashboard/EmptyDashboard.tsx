import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your inventory is empty!
          </h2>
          <p className="text-gray-600 mb-6">
            Start adding items to track expiration dates and reduce food waste.
          </p>
          <Button asChild size="lg" className="w-full mb-3">
            <Link href="/inventory">
              <Plus className="w-5 h-5 mr-2" />
              Add First Item
            </Link>
          </Button>
          <p className="text-sm text-gray-500">or</p>
          <Button variant="link" className="text-blue-600">
            Import from shopping list
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}