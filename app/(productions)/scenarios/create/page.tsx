"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SeatMap } from "@/components/seat-map"
import { PricingPicker, PricePoint } from "@/components/pricing-picker"
import { toast } from "sonner"
import { SeatPlan } from "@/types/seat-plan"
import { SeatMapEditor } from "@/components/seat-map-editor"

type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

type Production = {
  id: number
  name: string
}

export default function CreateScenarioPage() {
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
    async function fetchData() {
      try {
        // Fetch theaters
        const theatersResponse = await fetch('/api/theaters');
        if (!theatersResponse.ok) throw new Error('Failed to fetch theaters');
        const theatersData = await theatersResponse.json();
        setTheaters(theatersData);
        setSelectedTheater(theatersData[0]);

        // Fetch production
        if (productionId) {
          const productionResponse = await fetch(`/api/productions/${productionId}`);
          if (!productionResponse.ok) throw new Error('Failed to fetch production');
          const productionData = await productionResponse.json();
          setProduction(productionData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [productionId]);

  useEffect(() => {
    async function fetchSeatPlan() {
      if (!selectedTheater) return;
      
      try {
        const response = await fetch(`/api/theaters/${selectedTheater.id}/seatplan`);
        if (!response.ok) throw new Error('Failed to fetch seat plan');
        const data = await response.json();
        setSeatPlan(data);
      } catch (error) {
        console.error('Error fetching seat plan:', error);
        toast.error('Failed to load seat plan');
      }
    }

    fetchSeatPlan();
  }, [selectedTheater]);

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

  const handleSaveScenario = async () => {
    if (!selectedTheater || !seatPlan || !pricePoints.length) {
      toast.error('Please select a venue and set up pricing before saving');
      return;
    }

    if (!scenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    if (!productionId) {
      toast.error('Production ID is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDescription,
          productionId: Number(productionId),
          theaterId: selectedTheater.id,
          seatmap: seatPlan,
          pricing: pricePoints
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save scenario');
      }

      const savedScenario = await response.json();
      toast.success('Scenario saved successfully');
      router.push(`/scenarios/${savedScenario.id}`);
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast.error('Failed to save scenario');
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
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
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
            onValueChange={(value) => {
              const theater = theaters.find(t => t.id === Number(value));
              if (theater) setSelectedTheater(theater);
            }}
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
            />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveScenario} 
          disabled={isSaving || !scenarioName.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Scenario'}
        </Button>
      </div>
    </div>
  );
} 