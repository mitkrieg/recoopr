"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PricePoint } from "@/components/pricing-picker"
import { toast } from "sonner"
import { SeatPlan } from "@/types/seat-plan"
import { SeatMapEditor } from "@/components/seat-map-editor"
import { getTheaters, getTheaterSeatPlan, getProduction, createScenario } from "../../actions"
import { PriceChart } from "@/components/price-chart"
import { Card } from "@/components/ui/card"
type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

type Production = {
  id: number
  name: string
}

function CreateScenarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productionId = searchParams.get('productionId');
  
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [production, setProduction] = useState<Production | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);
  const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { theaters, error: theatersError } = await getTheaters();
        if (theatersError || !theaters) {
          throw new Error(theatersError || 'Failed to load theaters');
        }
        setTheaters(theaters);

        const { production, error: productionError } = await getProduction(Number(productionId));
        if (productionError || !production) {
          throw new Error(productionError || 'Production not found');
        }
        setProduction(production);

        // If we have theaters, load the seat plan for the first theater
        if (theaters.length > 0) {
          const { seatPlan: initialSeatPlan, error: seatPlanError } = await getTheaterSeatPlan(theaters[0].id);
          if (seatPlanError || !initialSeatPlan) {
            throw new Error(seatPlanError || 'Failed to load seat plan');
          }
          setSelectedTheater(theaters[0]);
          setSeatPlan(initialSeatPlan);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [productionId]);

  const handleVenueChange = async (value: string) => {
    const theaterId = Number(value);
    try {
      console.log('Loading seat plan for theater:', theaterId);
      const { seatPlan: newSeatPlan, error } = await getTheaterSeatPlan(theaterId);
      if (error || !newSeatPlan) {
        console.error('Failed to load seat plan:', error);
        throw new Error(error || 'Failed to load seat plan');
      }
      console.log('Loaded seat plan:', newSeatPlan);

      const theater = theaters.find(t => t.id === theaterId);
      if (theater) {
        setSelectedTheater(theater);
        setSeatPlan(newSeatPlan);
        setPricePoints([]);
        setSelectedPricePoint(null);
      } else {
        console.error('Theater not found:', theaterId);
        toast.error('Theater not found');
      }
    } catch (error) {
      console.error('Error changing venue:', error);
      toast.error('Failed to load seat plan');
    }
  };

  const handleSeatClick = (sectionId: number, rowId: number, seatId: number) => {
    if (!selectedPricePoint || !seatPlan) {
      console.log('Missing required data:', { selectedPricePoint, seatPlan });
      return;
    }
    
    console.log('Updating seat with price point:', selectedPricePoint);
    
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
                const updatedSeat = {
                  ...seat,
                  price: selectedPricePoint.price,
                  attributes: selectedPricePoint.attributes,
                  status: selectedPricePoint.attributes.houseSeat ? 'house' : 
                         selectedPricePoint.attributes.emergency ? 'emergency' : 
                         selectedPricePoint.attributes.premium ? 'premium' : 
                         selectedPricePoint.attributes.accessible ? 'accessible' : 
                         selectedPricePoint.attributes.restrictedView ? 'restricted' : 'available'
                };
                console.log('Updated seat:', updatedSeat);
                return updatedSeat;
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

    if (!scenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    setIsSaving(true);
    try {
      const { scenario, error } = await createScenario({
        name: scenarioName,
        description: scenarioDescription,
        productionId: Number(productionId),
        theaterId: selectedTheater.id,
        seatmap: seatPlan,
        pricing: pricePoints
      });

      if (error || !scenario) {
        throw new Error(error || 'Failed to create scenario');
      }

      toast.success('Scenario created successfully');
      router.push(`/scenarios/${scenario.id}`);
    } catch (error) {
      console.error('Error creating scenario:', error);
      toast.error('Failed to create scenario');
    } finally {
      setIsSaving(false);
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
          <h1 className="text-2xl font-bold">Create New Scenario</h1>
          <p className="text-gray-500">For {production.name}</p>
        </div>
        <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !scenarioName.trim()}
        >
          {isSaving ? 'Saving...' : 'Create Scenario'}
        </Button>
      </div>
      </div>
      <div className="flex gap-4 w-full justify-between">
      <Card  className="space-y-4 w-1/2 p-4">
        <div className="space-y-2">
          <Label htmlFor="scenario-name">Scenario Name</Label>
          <Input
            id="scenario-name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Enter scenario name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scenario-description">Description</Label>
          <Textarea
            id="scenario-description"
            value={scenarioDescription}
            onChange={(e) => setScenarioDescription(e.target.value)}
            placeholder="Enter scenario description"
          />
        </div>
        <div className="space-y-2">
          <Label>Venue</Label>
          <Select 
            value={selectedTheater?.id.toString()} 
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

        
      </Card  >
      <div className="w-90 h-full">
            {seatPlan && <PriceChart data={seatPlan} pricePoints={pricePoints} />}
        </div>  
      </div>
      

      <div className="flex gap-4 w-full">
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

      
    </div>
  );
}

export default function CreateScenarioPage() {
  return (
    <Suspense>
      <CreateScenarioContent />
    </Suspense>
  );
} 