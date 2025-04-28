"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { format, isValid } from "date-fns"
import { use } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Scenario = {
  id: number
  name: string
  description: string
  theaterId: number
  theaterName: string
  updatedAt: string
}

type Production = {
  id: number
  name: string
  startDate: string
  endDate: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
};

export default function ProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [production, setProduction] = useState<Production | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);
  const { id } = use(params);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch production
        const productionResponse = await fetch(`/api/productions/${id}`);
        if (!productionResponse.ok) {
          if (productionResponse.status === 404) {
            toast.error('Production not found');
          } else {
            throw new Error('Failed to fetch production');
          }
          return;
        }
        const productionData = await productionResponse.json();
        setProduction(productionData);

        // Fetch scenarios
        const scenariosResponse = await fetch(`/api/scenarios?productionId=${id}`);
        if (!scenariosResponse.ok) throw new Error('Failed to fetch scenarios');
        const scenariosData = await scenariosResponse.json();
        setScenarios(scenariosData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load production data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleCreateScenario = () => {
    router.push(`/scenarios/create?productionId=${id}`);
  };

  const handleDeleteScenario = async () => {
    if (!scenarioToDelete) return;

    try {
      const response = await fetch(`/api/scenarios/${scenarioToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scenario');
      }

      toast.success('Scenario deleted successfully');
      setScenarios(scenarios.filter(s => s.id !== scenarioToDelete.id));
      setShowDeleteDialog(false);
      setScenarioToDelete(null);
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
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
            {formatDate(production.startDate)} - {formatDate(production.endDate)}
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
                    {scenario.theaterName}
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/scenarios/${scenario.id}`)}
                  >
                    {formatDate(scenario.updatedAt)}
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the scenario "{scenarioToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteScenario}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 