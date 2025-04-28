'use client';

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatMapEditor } from "@/components/seat-map-editor";
import { PricingPicker, PricePoint } from "@/components/pricing-picker";
import { SeatPlan } from "@/types/seat-plan";

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

    useEffect(() => {
        fetch('/api/theaters')
            .then(res => res.json())
            .then(data => {
                setTheaters(data);
                setSelectedTheater(data[0]);
            });
    }, []);

    const handleTheaterChange = (value: string) => {
        const theater = theaters.find(t => t.id === Number(value));
        if (theater) {
            setSelectedTheater(theater);
        }
    };

    const handleSeatClick = (sectionId: number, rowId: number, seatId: number) => {
        if (!selectedPricePoint || !seatPlan) return;
        // Add your seat click logic here
    };

    if (!selectedTheater) {
        return <div>No theater selected</div>;
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