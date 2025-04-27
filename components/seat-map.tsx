import { useState, useEffect } from "react";
import { Squircle } from "lucide-react";
import { normalizeSeatPositions } from "@/utils/seat-position-normalizer";
import { Theater, SeatPlan } from "@/types/seat-plan";
import { PricePoint } from "@/components/pricing-picker";

export function SeatMap({ 
    theater, 
    pricePoints = [], 
    selectedPricePoint, 
    onSeatClick,
    seatPlan: initialSeatPlan 
}: { 
    theater: Theater, 
    pricePoints?: PricePoint[],
    selectedPricePoint: PricePoint | null,
    onSeatClick: (sectionId: number, rowId: number, seatId: number) => void,
    seatPlan: SeatPlan | null
}) {
    const [seatPlan, setSeatPlan] = useState<SeatPlan | null>(initialSeatPlan);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!initialSeatPlan) {
            fetch(`/api/theaters/${theater.id}/seatplan`)
                .then(res => res.json())
                .then(data => setSeatPlan(normalizeSeatPositions(data)));
        } else {
            setSeatPlan(initialSeatPlan);
        }
    }, [theater, initialSeatPlan]);

    const handleMouseDown = () => {
        if (selectedPricePoint) {
            setIsDragging(true);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseEnter = (sectionId: number, rowId: number, seatId: number) => {
        if (isDragging && selectedPricePoint) {
            onSeatClick(sectionId, rowId, seatId);
        }
    };

    if (!seatPlan) return <div>Loading seat plan...</div>;

    return (
        <div 
            className="mt-8 seat-map-container" 
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
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
                                                {row.seats.map(seat => {
                                                    const pricePoint = pricePoints.find(p => p.price === seat.price);
                                                    console.log('Rendering seat:', { seat, pricePoint });
                                                    return (
                                                        <div
                                                            key={seat.id}
                                                            className={`absolute w-8 h-8 flex items-center justify-center text-xs rounded group seat cursor-pointer`}
                                                            style={{
                                                                left: seat.x,
                                                                top: seat.y,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                            onClick={() => onSeatClick(section.id, row.id, seat.id)}
                                                            onMouseDown={handleMouseDown}
                                                            onMouseEnter={() => handleMouseEnter(section.id, row.id, seat.id)}
                                                        >
                                                            <Squircle 
                                                                className="size-4 seat-icon" 
                                                                style={{ 
                                                                    color: pricePoint?.color || 'currentColor',
                                                                    fill: pricePoint?.color || 'none'
                                                                }} 
                                                            />
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap seat-label pointer-events-none">
                                                                {seat.displayNumber}
                                                                {pricePoint && (
                                                                    <div className="mt-1">
                                                                        <span className="font-medium">${pricePoint.price.toFixed(2)}</span>
                                                                        <div className="flex gap-1 mt-1">
                                                                            {pricePoint.attributes.houseSeat && (
                                                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">House</span>
                                                                            )}
                                                                            {pricePoint.attributes.emergency && (
                                                                                <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">Emergency</span>
                                                                            )}
                                                                            {pricePoint.attributes.premium && (
                                                                                <span className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">Premium</span>
                                                                            )}
                                                                            {pricePoint.attributes.accessible && (
                                                                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Accessible</span>
                                                                            )}
                                                                            {pricePoint.attributes.restrictedView && (
                                                                                <span className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded">Restricted</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
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