"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState, useCallback } from "react"
import { redirect, useRouter } from "next/navigation"
import { normalizeSeatPositions } from "@/utils/seat-position-normalizer"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/DateRangePicker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWR from 'swr';
import { SeatMap } from "@/components/seat-map"
import { PricingPicker, PricePoint } from "@/components/pricing-picker"
import { SeatPlan } from "@/types/seat-plan"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SeatMapEditor } from "@/components/seat-map-editor"
type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Production name must be at least 2 characters.",
  }),
  performanceDates: z.object({
    from: z.date(),
    to: z.date(),
  }),
  venue: z.string().min(2, {
    message: "Venue must be at least 2 characters.",
  }),
  capitalization: z.object({
    capitalization: z.number().min(0).max(1000000000)
  })
})

const fetcher = (url: string) => fetch(url).then(res => res.json())

function InputForm() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduction, setCreatedProduction] = useState<{id: number, name: string, startDate: string, endDate: string} | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);
  const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<Array<{
    id: number;
    name: string;
    description: string;
    seatmap: SeatPlan;
    pricing: PricePoint[];
  }>>([]);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const router = useRouter();
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  
  useEffect(() => {
    async function fetchTheaters() {
      try {
        const response = await fetch('/api/theaters');
        if (!response.ok) {
          throw new Error('Failed to fetch theaters');
        }
        const data = await response.json();
        setTheaters(data);
      } catch (error) {
        console.error('Error fetching theaters:', error);
        toast('Failed to load theaters', {
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTheaters();
  }, []);

  useEffect(() => {
    async function fetchSeatPlan() {
      if (!selectedVenue) return;
      
      try {
        const response = await fetch(`/api/theaters/${selectedVenue}/seatplan`);
        if (!response.ok) {
          throw new Error('Failed to fetch seat plan');
        }
        const data = await response.json();
        setSeatPlan(normalizeSeatPositions(data));
      } catch (error) {
        console.error('Error fetching seat plan:', error);
        toast('Failed to load seat plan', {
          description: 'Please try again later',
        });
      }
    }
    
    fetchSeatPlan();
  }, [selectedVenue]);

  useEffect(() => {
    if (createdProduction?.id) {
      loadScenarios();
    }
  }, [createdProduction?.id]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      performanceDates: {
        from: new Date(),
        to: new Date(),
      },
      venue: "",
      capitalization: {
        capitalization: 100,
      },
    },
  })

  const handleSeatClick = useCallback((sectionId: number, rowId: number, seatId: number) => {
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
  }, [selectedPricePoint, seatPlan]);

  const handlePricePointSelect = useCallback((pricePoint: PricePoint | null) => {
    setSelectedPricePoint(pricePoint);
  }, []);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    setSelectedVenue(Number(data.venue));
    try {
      const response = await fetch('/api/productions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          startDate: data.performanceDates.from.toISOString(),
          endDate: data.performanceDates.to.toISOString(),
          capitalization: data.capitalization.capitalization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create production');
      }

      const result = await response.json();
      console.log('API Response:', result);
      toast.success('Production created successfully');
      setCreatedProduction(result);
    } catch (error) {
      console.error('Error creating production:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create production');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSaveScenario = async () => {
    if (!selectedVenue || !seatPlan || !pricePoints.length) {
      toast.error('Please select a venue and set up pricing before saving');
      return;
    }

    if (!scenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    setIsSavingScenario(true);
    try {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDescription,
          productionId: createdProduction?.id,
          theaterId: selectedVenue,
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
      setIsSavingScenario(false);
    }
  };

  const handleUpdateScenario = async () => {
    if (!editingScenarioId || !selectedVenue || !seatPlan || !pricePoints.length) {
      toast.error('Please select a venue and set up pricing before saving');
      return;
    }

    if (!scenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    setIsSavingScenario(true);
    try {
      const response = await fetch(`/api/scenarios/${editingScenarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scenarioName,
          description: scenarioDescription,
          theaterId: selectedVenue,
          seatmap: seatPlan,
          pricing: pricePoints
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update scenario');
      }

      toast.success('Scenario updated successfully');
      setEditingScenarioId(null);
      loadScenarios(); // Refresh the scenarios list
    } catch (error) {
      console.error('Error updating scenario:', error);
      toast.error('Failed to update scenario');
    } finally {
      setIsSavingScenario(false);
    }
  };

  const loadScenarios = async () => {
    setIsLoadingScenarios(true);
    try {
      const response = await fetch(`/api/scenarios?productionId=${createdProduction?.id}`);
      if (!response.ok) {
        throw new Error('Failed to load scenarios');
      }
      const scenarios = await response.json();
      setSavedScenarios(scenarios);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast.error('Failed to load scenarios');
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  const handleLoadScenario = async () => {
    if (!selectedScenario) {
      toast.error('Please select a scenario to load');
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${selectedScenario}`);
      if (!response.ok) {
        throw new Error('Failed to load scenario');
      }
      const scenario = await response.json();
      
      setSeatPlan(scenario.seatmap);
      setPricePoints(scenario.pricing);
      setSelectedVenue(scenario.theaterId);
      setScenarioName(scenario.name);
      setScenarioDescription(scenario.description);
      setEditingScenarioId(scenario.id);
      
      toast.success('Scenario loaded successfully');
    } catch (error) {
      console.error('Error loading scenario:', error);
      toast.error('Failed to load scenario');
    }
  };

  if (createdProduction) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{createdProduction.name}</h1>
          <div className="flex gap-2">
            <Select 
              value={selectedScenario?.toString()} 
              onValueChange={(value) => setSelectedScenario(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingScenarios ? (
                  <SelectItem value="loading" disabled>Loading scenarios...</SelectItem>
                ) : savedScenarios.length === 0 ? (
                  <SelectItem value="none" disabled>No saved scenarios</SelectItem>
                ) : (
                  savedScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id.toString()}>
                      {scenario.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleLoadScenario} 
              disabled={!selectedScenario}
            >
              Load Scenario
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p>{new Date(createdProduction.startDate).toLocaleDateString()} - {new Date(createdProduction.endDate).toLocaleDateString()}</p>
        </div>
        <div className="space-y-4">
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
              value={selectedVenue?.toString()} 
              onValueChange={(value) => setSelectedVenue(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading venues...</SelectItem>
                ) : theaters.length === 0 ? (
                  <SelectItem value="none" disabled>No venues available</SelectItem>
                ) : (
                  theaters.map((theater) => (
                    <SelectItem key={theater.id} value={theater.id.toString()}>
                      {theater.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            {editingScenarioId ? (
              <Button 
                onClick={handleUpdateScenario} 
                disabled={isSavingScenario || !scenarioName.trim()}
              >
                {isSavingScenario ? 'Saving...' : 'Update Scenario'}
              </Button>
            ) : (
              <Button 
                onClick={handleSaveScenario} 
                disabled={isSavingScenario || !scenarioName.trim()}
              >
                {isSavingScenario ? 'Saving...' : 'Save New Scenario'}
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-4 w-full">
          <div className="flex-1">
            {selectedVenue && (
              <SeatMapEditor 
                theater={theaters.find(t => t.id === selectedVenue)!} 
                pricePoints={pricePoints}
                selectedPricePoint={selectedPricePoint}
                onSeatClick={handleSeatClick}
                seatPlan={seatPlan}
                onPricePointsChange={setPricePoints}
                onPricePointSelect={handlePricePointSelect}
                onSeatPlanUpdate={setSeatPlan}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Name</FormLabel>
              <FormControl>
                <Input placeholder="West Side Story" {...field} />
              </FormControl>
              {/* <FormDescription>
                This is the name of the production.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="performanceDates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Performance Dates</FormLabel>
              <FormControl>
                <DatePickerWithRange
                  className="w-full"
                  initialDates={field.value}
                  onDateChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Loading theaters...</SelectItem>
                    ) : theaters.length === 0 ? (
                      <SelectItem value="none" disabled>No theaters available</SelectItem>
                    ) : (
                      theaters.map((theater) => (
                        <SelectItem key={theater.id} value={theater.id.toString()}>
                          {theater.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capitalization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capitalization</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1 text-gray-500">$</span>
                  <Input 
                    type="number" 
                    value={field.value.capitalization || ''}
                    onChange={(e) => field.onChange({ capitalization: Number(e.target.value) || 0 })}
                    className="pl-7 placeholder:text-gray-400"
                    placeholder="100"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem> 
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}

export default function CreateProductionPage() {

  const { data: user, error, isLoading: isUserLoading } = useSWR('/api/user', fetcher);

  if (!user) {
    redirect('/sign-in');
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create a New Production</h1>
      <p className="text-gray-500">Create a new production for your theater.</p>
      <InputForm />
    </div>
  )
}
