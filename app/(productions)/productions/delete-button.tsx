'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteProduction } from '../actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DeleteProductionButton({ productionId }: { productionId: number }) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = async () => {
    try {
      const result = await deleteProduction(productionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Production deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete production');
    } finally {
      setShowDialog(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="p-2 hover:bg-red-50 rounded-full transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Production</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this production? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 