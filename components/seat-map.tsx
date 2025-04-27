import { useState, useEffect } from "react";
import { Squircle } from "lucide-react";
import { normalizeSeatPositions } from "@/utils/seat-position-normalizer";
import { Theater, SeatPlan } from "@/types/seat-plan";

export function SeatMap({ theater }: { theater: Theater }) {
    const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(null);

    useEffect(() => {
        fetch(`/api/theaters/${theater.id}/seatplan`)
            .then(res => res.json())
            .then(data => setSeatPlan(normalizeSeatPositions(data)));
    }, [theater]);

    if (!seatPlan) return <div>Loading seat plan...</div>;

    return (
        <div className="mt-8 seat-map-container">
            <h2 className="text-2xl font-bold mb-4 theater-name">{seatPlan.theater.name}</h2>
            <div className="space-y-8 parent-sections">
                {Object.entries(
                    seatPlan.sections.reduce((acc, section) => {
                        const parentKey = section.parentSection || 'Main';
                        if (!acc[parentKey]) {
                            acc[parentKey] = [];
                        }
                        acc[parentKey].push(section);
                        return acc;
                    }, {} as Record<string, typeof seatPlan.sections>)
                )
                .sort(([a], [b]) => {
                    const order = ['O', 'M', 'D', 'B'];
                    const aStart = a.substring(0, 1);
                    const bStart = b.substring(0, 1);
                    const aIndex = order.indexOf(aStart);
                    const bIndex = order.indexOf(bStart);
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                })
                .map(([parentName, sections]) => (
                    <div key={parentName} className="border rounded-lg p-4 parent-section flex flex-col items-start">
                        <h3 className="text-lg font-semibold mb-4 parent-section-name">{parentName}</h3>
                        <div className="flex flex-wrap gap-2 section-grid justify-start items-start w-full overflow-auto">
                            {sections.map(section => {
                                const sectionMaxX = Math.max(...section.rows.flatMap(row => 
                                    row.seats.map(seat => seat.x)
                                )) + 10;
                                const sectionMaxY = Math.max(...section.rows.flatMap(row => 
                                    row.seats.map(seat => seat.y)
                                )) + 10;

                                return (
                                    <div key={section.id} className="relative seat-section self-start transform scale-100 md:scale-90 lg:scale-100" style={{ height: sectionMaxY }}>
                                        {section.rows.map(row => (
                                            <div key={row.id} className="seat-row">
                                                {row.seats.map(seat => (
                                                    <div
                                                        key={seat.id}
                                                        className={`absolute w-8 h-8 flex items-center justify-center text-xs rounded group seat`}
                                                        style={{
                                                            left: seat.x,
                                                            top: seat.y,
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                    >
                                                        <Squircle className="size-4 seat-icon" />
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap seat-label pointer-events-none">
                                                            {seat.displayNumber}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}