"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { format, isValid } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/components/price-chart"
import { getProduction, getScenarios, deleteScenario, getTheater, deleteProduction } from "../../actions"

type Production = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  capitalization: number | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

type Scenario = {
  id: number;
  name: string;
  description: string | null;
  theaterId: number;
  productionId: number;
  createdAt: Date;
  updatedAt: Date;
  seatmap: any;
  pricing: any[];
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
};

export default function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  
  const [production, setProduction] = useState<Production | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [theaters, setTheaters] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { production, error: productionError } = await getProduction(id);
        if (productionError || !production) {
          throw new Error(productionError || 'Production not found');
        }
        setProduction(production);

        const { scenarios, error: scenariosError } = await getScenarios(id);
        if (scenariosError || !scenarios) {
          throw new Error(scenariosError || 'Failed to load scenarios');
        }
        setScenarios(scenarios);

        // Load theater names for all scenarios
        const theaterIds = [...new Set(scenarios.map((s: Scenario) => s.theaterId))];
        const theaterNames: Record<number, string> = {};
        
        await Promise.all(theaterIds.map(async (id) => {
          const { theater, error } = await getTheater(id);
          if (theater) {
            theaterNames[id] = theater.name;
          }
        }));

        setTheaters(theaterNames);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load production data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleCreateScenario = () => {
    router.push(`/scenarios/create?productionId=${id}`);
  };

  const handleDeleteScenario = async (scenarioToDelete: Scenario) => {
    try {
      const { error } = await deleteScenario(scenarioToDelete.id);
      if (error) {
        throw new Error(error);
      }

      setScenarios(scenarios.filter(s => s.id !== scenarioToDelete.id));
      toast.success('Scenario deleted successfully');
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      const result = await deleteProduction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Production deleted successfully');
      router.push('/productions');
    } catch (error) {
      console.error('Error deleting production:', error);
      toast.error('Failed to delete production');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!production) {
    return <div>Production not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{production.name}</h1>
          <p className="text-gray-500">
            Captiolization {formatCurrency(Number(production.capitalization))}
          </p>
          <p className="text-gray-500">
            {formatDate(production.startDate)} - {formatDate(production.endDate || '')}
          </p>
        </div>
        <Button onClick={handleCreateScenario}>
          Create New Scenario
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario Name</TableHead>
              <TableHead>Theater</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No scenarios found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              scenarios.map((scenario) => (
                <TableRow 
                  key={scenario.id} 
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell 
                    className="font-medium"
                    onClick={() => router.push(`/scenarios/${scenario.id}`)}
                  >
                    {scenario.name}
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/scenarios/${scenario.id}`)}
                  >
                    <div className="text-sm text-gray-500">
                      {theaters[scenario.theaterId] || 'Unknown Theater'}
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/scenarios/${scenario.id}`)}
                  >
                    {formatDate(scenario.updatedAt.toISOString())}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScenarioToDelete(scenario);
                        setShowDeleteDialog(true);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{production?.name}</h1>
        <Button variant="destructive" onClick={handleDeleteClick}>
          Delete Production
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Production</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this production? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 