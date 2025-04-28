"use client"

import { useEffect, useState } from "react"
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
import { use } from "react"
import { SeatMapEditor } from "@/components/seat-map-editor"

type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

type Scenario = {
  id: number
  productionId: number
  name: string
  description: string
  theaterId: number
  seatmap: SeatPlan
  pricing: PricePoint[]
}

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);
  const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);
  const [showVenueChangeDialog, setShowVenueChangeDialog] = useState(false);
  const [pendingVenueChange, setPendingVenueChange] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch theaters
        const theatersResponse = await fetch('/api/theaters');
        if (!theatersResponse.ok) throw new Error('Failed to fetch theaters');
        const theatersData = await theatersResponse.json();
        setTheaters(theatersData);

        // Fetch scenario
        const scenarioResponse = await fetch(`/api/scenarios/${resolvedParams.id}`);
        if (!scenarioResponse.ok) throw new Error('Failed to fetch scenario');
        const scenarioData = await scenarioResponse.json();
        setScenario(scenarioData);
        
        // Set form values
        setName(scenarioData.name);
        setDescription(scenarioData.description);
        setSelectedVenue(scenarioData.theaterId);
        setPricePoints(scenarioData.pricing);
        setSeatPlan(scenarioData.seatmap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast('Failed to load scenario');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [resolvedParams.id]);

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
    if (!selectedVenue || !seatPlan || !pricePoints.length) {
      toast('Please select a venue and set up pricing before saving');
      return;
    }

    if (!name.trim()) {
      toast('Please enter a scenario name');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          theaterId: selectedVenue,
          seatmap: seatPlan,
          pricing: pricePoints
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update scenario');
      }

      toast('Scenario updated successfully');
      router.refresh(); // Refresh the page to ensure latest data
    } catch (error) {
      console.error('Error updating scenario:', error);
      toast('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVenueChange = (value: string) => {
    const newVenueId = Number(value);
    if (newVenueId !== selectedVenue) {
      setPendingVenueChange(newVenueId);
      setShowVenueChangeDialog(true);
    }
  };

  const confirmVenueChange = () => {
    if (pendingVenueChange) {
      setSelectedVenue(pendingVenueChange);
      setSeatPlan(null); // Reset seat plan to trigger reload
      setPricePoints([]); // Reset pricing
    }
    setShowVenueChangeDialog(false);
    setPendingVenueChange(null);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/scenarios/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scenario');
      }

      toast('Scenario deleted');
      router.push(`/productions/${scenario?.productionId}`);
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast('Failed to delete scenario');
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
              value={selectedVenue?.toString()} 
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
          {selectedVenue && (
            <SeatMapEditor 
              theater={theaters.find(t => t.id === selectedVenue)!} 
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
            <Button onClick={confirmVenueChange}>
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