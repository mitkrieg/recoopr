'use client';

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatMap } from "@/components/seat-map";
import { PricingPicker, PricePoint } from "@/components/pricing-picker";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Theater = {
    id: number;
    name: string;
    venueSlug: string | null;
}

export default function ProductionsPage() {
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
    const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);

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
                    <SeatMap theater={selectedTheater} pricePoints={pricePoints} />
                </div>
                <div className="w-60 shrink-0">
                    <div className="sticky top-4">
                        <PricingPicker pricePoints={pricePoints} onChange={setPricePoints} />
                    </div>
                </div>
            </div>
        </div>
    );
}