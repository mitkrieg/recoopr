'use client';

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatMapEditor } from "@/components/seat-map-editor";
import { PricePoint } from "@/components/pricing-picker";
import { SeatPlan } from "@/types/seat-plan";
import { getTheaters, getTheaterSeatPlan } from "../../actions"

type Theater = {
    id: number;
    name: string;
    venueSlug: string | null;
}

export default function ProductionsPage() {
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
    const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
    const [selectedPricePoint, setSelectedPricePoint] = useState<PricePoint | null>(null);
    const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load theaters
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        getTheaters().then(({ theaters: data, error }) => {
            if (error) {
                console.error('Error fetching theaters:', error);
                setError('Failed to load theaters');
                return;
            }
            if (!data) {
                setError('No theaters data received');
                return;
            }
            setTheaters(data);
            if (data.length > 0) {
                setSelectedTheater(data[0]);
            }
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    // Load seat plan when theater changes
    useEffect(() => {
        if (!selectedTheater) return;

        setIsLoading(true);
        setError(null);
        getTheaterSeatPlan(selectedTheater.id).then(({ seatPlan: data, error }) => {
            if (error) {
                console.error('Error fetching seat plan:', error);
                setError('Failed to load seat plan');
                return;
            }
            if (!data) {
                setError('No seat plan data received');
                return;
            }
            setSeatPlan(data);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [selectedTheater]);

    const handleTheaterChange = (value: string) => {
        const theater = theaters.find(t => t.id === Number(value));
        if (theater) {
            setSelectedTheater(theater);
        }
    };

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
                      attributes: selectedPricePoint.attributes,
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

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
    }

    if (!selectedTheater) {
        return <div className="flex items-center justify-center min-h-screen">No theaters available</div>;
    }

    // create a select menu for the theaters
    const theaterSelect = (
        <Select onValueChange={handleTheaterChange} defaultValue={selectedTheater.id.toString()}>
            <SelectTrigger>
                <SelectValue placeholder="Select a theater" />
            </SelectTrigger>
            <SelectContent>
                {theaters.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <div className="container mx-auto p-4 w-full">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Theaters</h1>
            <div className="mt-4">
                {theaterSelect}
            </div>
            <div className="flex gap-4 mt-4">
                <div className="flex-1">
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
                </div>
            </div>
        </div>
    );
}