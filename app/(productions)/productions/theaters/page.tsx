'use client';

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatMap } from "@/components/seat-map";
type Theater = {
    id: number;
    name: string;
    venueSlug: string | null;
}

export default function ProductionsPage() {
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);

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
        <>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Theaters</h1>
        <div className="mt-4">
            {theaterSelect}
        </div>
        <SeatMap theater={selectedTheater} />
        </>
    );
}