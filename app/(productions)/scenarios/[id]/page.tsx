"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { SeatMap } from "@/components/seat-map"
import { PricingPicker, PricePoint } from "@/components/pricing-picker"
import { SeatPlan } from "@/types/seat-plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PriceChart } from "@/components/price-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SeatMapEditor } from "@/components/seat-map-editor"
import { getTheaters, getTheaterSeatPlan, getScenario, updateScenario, deleteScenario } from "../../actions"

type Theater = {
  id: number;
  name: string;
  url: string | null;
  venueId: string | null;
  venueSlug: string | null;
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

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showVenueChangeDialog, setShowVenueChangeDialog] = useState(false);
  const [pendingVenueChange, setPendingVenueChange] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { theaters, error: theatersError } = await getTheaters();
        if (theatersError || !theaters) {
          throw new Error(theatersError || 'Failed to load theaters');
        }
        setTheaters(theaters);

        const { scenario, error: scenarioError } = await getScenario(id);
        if (scenarioError || !scenario) {
          throw new Error(scenarioError || 'Scenario not found');
        }
        setScenario(scenario);
        setName(scenario.name);
        setDescription(scenario.description || '');
        const theater = theaters.find(t => t.id === scenario.theaterId);
        if (theater) {
          setSelectedTheater(theater);
        }
        setSeatPlan(scenario.seatmap);
        setPricePoints(scenario.pricing);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load scenario data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSeatClick = (sectionId: number, rowId: number, seatId: number) => {
    if (!selectedPricePoint || !seatPlan) return;
    
    const updatedSeatPlan = {
      ...seatPlan,
      sections: seatPlan.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          rows: section.rows.map((row) => {
            if (row.id !== rowId) return row;
            return {
              ...row,
              seats: row.seats.map((seat) => {
                if (seat.id !== seatId) return seat;
                return {
                  ...seat,
                  price: selectedPricePoint.price,
                  status: selectedPricePoint.attributes.houseSeat ? 'house' : 
                         selectedPricePoint.attributes.emergency ? 'emergency' : 
                         selectedPricePoint.attributes.premium ? 'premium' : 
                         selectedPricePoint.attributes.accessible ? 'accessible' : 
                         selectedPricePoint.attributes.restrictedView ? 'restricted' : 'available'
                };
              })
            };
          })
        };
      })
    };

    setSeatPlan(updatedSeatPlan);
  };

  const handleSave = async () => {
    if (!selectedTheater || !seatPlan || !pricePoints.length) {
      toast.error('Please select a venue and set up pricing before saving');
      return;
    }

    setIsSaving(true);
    try {
      const { scenario, error } = await updateScenario(id, {
        name,
        description,
        theaterId: selectedTheater.id,
        seatmap: seatPlan,
        pricing: pricePoints
      });

      if (error || !scenario) {
        throw new Error(error || 'Failed to update scenario');
      }

      toast.success('Scenario updated successfully');
      router.push('/productions');
    } catch (error) {
      console.error('Error updating scenario:', error);
      toast.error('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVenueChange = async (value: string) => {
    const theaterId = Number(value);
    if (theaterId !== selectedTheater?.id) {
      try {
        const { seatPlan: newSeatPlan, error } = await getTheaterSeatPlan(theaterId);
        if (error || !newSeatPlan) {
          throw new Error(error || 'Failed to load seat plan');
        }

        const theater = theaters.find(t => t.id === theaterId);
        if (theater) {
          setSelectedTheater(theater);
          setSeatPlan(newSeatPlan);
          setPricePoints([]);
          setSelectedPricePoint(null);
        }
      } catch (error) {
        console.error('Error changing venue:', error);
        toast.error('Failed to load seat plan');
      }
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await deleteScenario(id);
      if (error) {
        throw new Error(error);
      }

      toast.success('Scenario deleted');
      router.push(`/productions/${scenario?.productionId}`);
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!scenario) {
    return <div>Scenario not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {/* <p className="text-gray-500">For {production.name}</p> */}
        </div>
        <div className="actionButtons flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/productions/${scenario.productionId}`)}>
            Back
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete Scenario
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="scenario-info-container flex flex-row justify-between gap-4">
        <div className="scenario-details flex flex-col space-y-4">
          <div className="scenario-name space-y-2 w-80">
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter scenario name"
            />
          </div>
          <div className="scenario-description space-y-2">
            <Label htmlFor="scenario-description">Description</Label>
            <Textarea
              id="scenario-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter scenario description"
            />
          </div>
          <div className="scenario-venue space-y-2">
            <Label>Venue</Label>
            <Select 
              value={selectedTheater?.id?.toString()} 
              onValueChange={handleVenueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {theaters.map((theater) => (
                  <SelectItem key={theater.id} value={theater.id.toString()}>
                    {theater.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="scenario-stats w-90 h-full">
          {seatPlan && <PriceChart data={seatPlan} pricePoints={pricePoints} />}
        </div>
      </div>
    
      

      <div className="scenario-seatmap flex gap-4 w-full">
        <div className="flex-1">
          {selectedTheater && (
            <SeatMapEditor 
              theater={selectedTheater} 
              pricePoints={pricePoints}
              selectedPricePoint={selectedPricePoint}
              onSeatClick={handleSeatClick}
              seatPlan={seatPlan}
              onPricePointsChange={setPricePoints}
              onPricePointSelect={setSelectedPricePoint}
              onSeatPlanUpdate={setSeatPlan}
            />
          )}
        </div>
      </div>

      <Dialog open={showVenueChangeDialog} onOpenChange={setShowVenueChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Venue</DialogTitle>
            <DialogDescription>
              Changing the venue will reset the seat map and pricing. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVenueChangeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowVenueChangeDialog(false)}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 