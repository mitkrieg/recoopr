"use client"

import { useEffect, useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SeatMap } from "@/components/seat-map"
import { PricingPicker, PricePoint } from "@/components/pricing-picker"
import { SeatPlan, Theater, Section, Row, Seat } from "@/types/seat-plan"
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
import { getTheaters, getTheaterSeatPlan, getScenario, updateScenario, deleteScenario, getProduction } from "../../actions"
import { Production } from "@/types/production"
import { Card } from "@/components/ui/card"
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [production, setProduction] = useState<Production | null>(null);
  const [pendingTheaterId, setPendingTheaterId] = useState<number | null>(null);

  // Create a memoized map of seats for faster access
  const seatMap = useMemo(() => {
    if (!seatPlan) return new Map();
    
    const map = new Map<string, { section: Section; row: Row; seat: Seat }>();
    seatPlan.sections.forEach(section => {
      section.rows.forEach(row => {
        row.seats.forEach(seat => {
          map.set(`${section.id}-${row.id}-${seat.id}`, { section, row, seat });
        });
      });
    });
    return map;
  }, [seatPlan]);

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
        console.log('Loaded scenario:', scenario);
        console.log('Price points:', scenario.pricing);
        console.log('Sample seats:', scenario.seatmap.sections[0]?.rows[0]?.seats.slice(0, 3));

        // Process the seatmap to ensure all seats have the correct attributes
        const processedSeatmap = {
          ...scenario.seatmap,
          sections: scenario.seatmap.sections.map((section: Section) => ({
            ...section,
            rows: section.rows.map((row: Row) => ({
              ...row,
              seats: row.seats.map((seat: Seat) => {
                // Find the matching price point for this seat
                const matchingPricePoint = scenario.pricing.find((p: PricePoint) => p.price === seat.price && p.attributes === seat.attributes);
                if (matchingPricePoint) {
                  return {
                    ...seat,
                    attributes: {
                      houseSeat: matchingPricePoint.attributes.houseSeat,
                      emergency: matchingPricePoint.attributes.emergency,
                      premium: matchingPricePoint.attributes.premium,
                      accessible: matchingPricePoint.attributes.accessible,
                      restrictedView: matchingPricePoint.attributes.restrictedView
                    }
                  };
                }
                return seat;
              })
            }))
          }))
        };

        setScenario(scenario);
        setName(scenario.name);
        setDescription(scenario.description || '');
        const theater = theaters.find(t => t.id === scenario.theaterId);
        if (theater) {
          setSelectedTheater(theater);
        }
        setSeatPlan(processedSeatmap);
        setPricePoints(scenario.pricing);
        // Set the first price point as selected by default if there are any price points
        if (scenario.pricing.length > 0) {
          setSelectedPricePoint(scenario.pricing[0]);
        }
        const { production, error: productionError } = await getProduction(scenario.productionId);
        if (productionError || !production) {
          throw new Error(productionError || 'Production not found');
        }
        setProduction(production);
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
    if (!selectedPricePoint || !seatPlan) {
      console.log('Missing required data:', { selectedPricePoint, seatPlan });
      return;
    }
    
    console.log('Updating seat with price point:', selectedPricePoint);
    
    const seatKey = `${sectionId}-${rowId}-${seatId}`;
    const seatData = seatMap.get(seatKey);
    
    if (!seatData) {
      console.error('Seat not found in map:', seatKey);
      return;
    }

    const { section, row, seat } = seatData;
    
    const updatedSeat = {
      ...seat,
      price: selectedPricePoint.price,
      attributes: {
        houseSeat: selectedPricePoint.attributes.houseSeat,
        emergency: selectedPricePoint.attributes.emergency,
        premium: selectedPricePoint.attributes.premium,
        accessible: selectedPricePoint.attributes.accessible,
        restrictedView: selectedPricePoint.attributes.restrictedView
      },
      status: selectedPricePoint.attributes.houseSeat ? 'house' : 
             selectedPricePoint.attributes.emergency ? 'emergency' : 
             selectedPricePoint.attributes.premium ? 'premium' : 
             selectedPricePoint.attributes.accessible ? 'accessible' : 
             selectedPricePoint.attributes.restrictedView ? 'restricted' : 'available'
    };

    console.log('Updated seat:', updatedSeat);

    const updatedSeatPlan = {
      ...seatPlan,
      sections: seatPlan.sections.map(s => {
        if (s.id !== section.id) return s;
        return {
          ...s,
          rows: s.rows.map(r => {
            if (r.id !== row.id) return r;
            return {
              ...r,
              seats: r.seats.map(seat => 
                seat.id === seatId ? updatedSeat : seat
              )
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
      // router.push(`/scenarios/${scenario.id}`);
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
      setPendingTheaterId(theaterId);
      setShowVenueChangeDialog(true);
    }
  };

  const handleConfirmVenueChange = async () => {
    if (!pendingTheaterId) return;
    
    try {
      const { seatPlan: newSeatPlan, error } = await getTheaterSeatPlan(pendingTheaterId);
      if (error || !newSeatPlan) {
        throw new Error(error || 'Failed to load seat plan');
      }

      const theater = theaters.find(t => t.id === pendingTheaterId);
      if (theater) {
        setSelectedTheater(theater);
        setSeatPlan(newSeatPlan);
        setPricePoints([]);
        setSelectedPricePoint(null);
      }
    } catch (error) {
      console.error('Error changing venue:', error);
      toast.error('Failed to load seat plan');
    } finally {
      setShowVenueChangeDialog(false);
      setPendingTheaterId(null);
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
          {production && <p className="text-gray-500">For {production.name}</p>}
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
        <Card className="scenario-details flex flex-col w-1/2 p-6">
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
        </Card>
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
            <Button variant="outline" onClick={() => {
              setShowVenueChangeDialog(false);
              setPendingTheaterId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmVenueChange}>
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