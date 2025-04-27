'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SeatMap } from "@/components/seat-map";
import { PricingPicker, PricePoint } from "@/components/pricing-picker";

type Scenario = {
  id: number;
  name: string;
  description: string | null;
  productionId: number;
  theaterId: number;
};

type Theater = {
  id: number;
  name: string;
  venueSlug: string | null;
};

export default function ScenarioPage() {
  const { id } = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [theater, setTheater] = useState<Theater | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScenario() {
      try {
        // Fetch the scenario
        const scenarioResponse = await fetch(`/api/scenarios/${id}`);
        if (!scenarioResponse.ok) {
          throw new Error('Failed to fetch scenario');
        }
        const scenarioData = await scenarioResponse.json();
        setScenario(scenarioData);
        
        // Fetch the theater based on the scenario's theaterId
        const theaterResponse = await fetch(`/api/theaters/${scenarioData.theaterId}`);
        if (!theaterResponse.ok) {
          throw new Error('Failed to fetch theater');
        }
        const theaterData = await theaterResponse.json();
        setTheater(theaterData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchScenario();
    }
  }, [id]);

  if (isLoading) {
    return <div>Loading scenario data...</div>;
  }

  if (!scenario || !theater) {
    return <div>Scenario or theater not found</div>;
  }

  return (
    <div className="container mx-auto p-4 w-full">
      <h1 className="text-3xl font-bold leading-tight text-gray-900">{scenario.name}</h1>
      {scenario.description && (
        <p className="mt-2 text-gray-500">{scenario.description}</p>
      )}
      
      <div className="flex flex-col lg:flex-row gap-4 mt-6">
        <div className="flex-1">
          <SeatMap theater={theater} pricePoints={pricePoints} />
        </div>
        <div className="w-full lg:w-60 shrink-0">
          <div className="sticky top-4">
            <PricingPicker 
              pricePoints={pricePoints} 
              onChange={setPricePoints} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 