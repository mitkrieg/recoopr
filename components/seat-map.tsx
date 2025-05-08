import { useState, useEffect, useMemo } from "react";
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
    const [lastSeat, setLastSeat] = useState<{sectionId: number, rowId: number, seatId: number} | null>(null);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
    const [hoveredSeat, setHoveredSeat] = useState<{sectionId: number, rowId: number, seatId: number} | null>(null);

    // Create a map of seat positions for O(1) access
    const seatPositionMap = useMemo(() => {
        if (!seatPlan) return new Map<string, { sectionId: number, rowId: number, seatId: number }>();
        
        const map = new Map<string, { sectionId: number, rowId: number, seatId: number }>();
        seatPlan.sections.forEach(section => {
            section.rows.forEach(row => {
                row.seats.forEach(seat => {
                    if (seat.x !== undefined && seat.y !== undefined) {
                        map.set(`${seat.x},${seat.y}`, {
                            sectionId: section.id,
                            rowId: row.id,
                            seatId: seat.id
                        });
                    }
                });
            });
        });
        return map;
    }, [seatPlan]);

    useEffect(() => {
        if (initialSeatPlan) {
            console.log('Normalizing seat positions...');
            const normalizedSeatPlan = normalizeSeatPositions(initialSeatPlan);
            console.log('Seat positions normalized:', normalizedSeatPlan);
            setSeatPlan(normalizedSeatPlan);
        }
    }, [initialSeatPlan]);

    const handleMouseDown = (sectionId: number, rowId: number, seatId: number) => {
        if (!selectedPricePoint) return;
        setIsDragging(true);
        setLastSeat({ sectionId, rowId, seatId });
        onSeatClick(sectionId, rowId, seatId);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setLastSeat(null);
    };

    const handleMouseEnter = (sectionId: number, rowId: number, seatId: number) => {
        if (isDragging && selectedPricePoint && lastSeat) {
            // Get the current and last seat positions
            const currentSection = seatPlan?.sections.find(s => s.id === sectionId);
            const lastSection = seatPlan?.sections.find(s => s.id === lastSeat.sectionId);
            
            if (!currentSection || !lastSection) return;
            
            const currentRow = currentSection.rows.find(r => r.id === rowId);
            const lastRow = lastSection.rows.find(r => r.id === lastSeat.rowId);
            
            if (!currentRow || !lastRow) return;
            
            const currentSeat = currentRow.seats.find(s => s.id === seatId);
            const lastSeatObj = lastRow.seats.find(s => s.id === lastSeat.seatId);
            
            if (!currentSeat || !lastSeatObj || !currentSeat.x || !currentSeat.y || !lastSeatObj.x || !lastSeatObj.y) return;
            
            // Calculate the range of seats to update
            const startX = Math.min(currentSeat.x, lastSeatObj.x);
            const endX = Math.max(currentSeat.x, lastSeatObj.x);
            const startY = Math.min(currentSeat.y, lastSeatObj.y);
            const endY = Math.max(currentSeat.y, lastSeatObj.y);
            
            // Update all seats in the range using the position map
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    const seatKey = `${x},${y}`;
                    const seatInfo = seatPositionMap.get(seatKey);
                    if (seatInfo) {
                        onSeatClick(seatInfo.sectionId, seatInfo.rowId, seatInfo.seatId);
                    }
                }
            }
            
            setLastSeat({ sectionId, rowId, seatId });
        }
        
        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        
        // Set a new timeout to show the popover after 500ms
        const timeout = setTimeout(() => {
            setHoveredSeat({ sectionId, rowId, seatId });
        }, 1000);
        
        setHoverTimeout(timeout);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }
        setHoveredSeat(null);
    };

    if (!seatPlan) return <div>Loading seat plan...</div>;

    return (
        <div 
            className="seat-map-container" 
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
                        <h3 className="text-lg font-semibold parent-section-name">{parentName}</h3>
                        <div className="flex flex-wrap gap-2 section-grid justify-start items-start w-full overflow-auto">
                            {sections.map(section => {
                                // const sectionMaxX = Math.max(...section.rows.flatMap(row => 
                                //     row.seats.map(seat => seat.x)
                                // )) + 10;
                                const sectionMaxY = Math.max(...section.rows.flatMap(row => 
                                    row.seats.map(seat => seat.y || 0)
                                )) + 10;

                                return (
                                    <div key={section.id} className="relative seat-section self-start transform scale-100 md:scale-90 lg:scale-100" style={{ height: sectionMaxY }}>
                                        {section.rows.map(row => (
                                            <div key={row.id} className="seat-row">
                                                {row.seats.map(seat => {
                                                    const pricePoint = pricePoints.find(p => 
                                                        p.price === seat.price && 
                                                        p.attributes.houseSeat === seat.attributes?.houseSeat &&
                                                        p.attributes.emergency === seat.attributes?.emergency &&
                                                        p.attributes.premium === seat.attributes?.premium &&
                                                        p.attributes.accessible === seat.attributes?.accessible &&
                                                        p.attributes.restrictedView === seat.attributes?.restrictedView
                                                    );
                                                    return (
                                                        <div
                                                            key={seat.id}
                                                            className={`absolute w-8 h-8 flex items-center justify-center text-xs rounded group seat cursor-pointer`}
                                                            style={{
                                                                left: seat.x || 0,
                                                                top: seat.y || 0,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                            onClick={() => onSeatClick(section.id, row.id, seat.id)}
                                                            onMouseDown={() => handleMouseDown(section.id, row.id, seat.id)}
                                                            onMouseEnter={() => handleMouseEnter(section.id, row.id, seat.id)}
                                                            onMouseLeave={handleMouseLeave}
                                                        >
                                                            <Squircle 
                                                                className="size-4 seat-icon shadow-2xl" 
                                                                style={{ 
                                                                    color: pricePoint?.color || 'currentColor',
                                                                    fill: pricePoint?.color || 'none'
                                                                }} 
                                                            />
                                                            <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm transition-opacity whitespace-nowrap seat-label pointer-events-none ${hoveredSeat?.sectionId === section.id && hoveredSeat?.rowId === row.id && hoveredSeat?.seatId === seat.id ? 'opacity-100' : 'opacity-0'}`}>
                                                                <div className="flex flex-row gap-1 items-center">
                                                                    <span className="font-bold">{seat.displayNumber}</span>
                                                                    {pricePoint && (
                                                                        <div className="flex flex-row gap-1 mt-1 mb-1 text-center">
                                                                            <span className="font-medium">${pricePoint.price.toFixed(2)}</span>
                                                                            <div className="flex flex-row gap-1 justify-center">
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
                                                                                    <span className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded">Restricted View</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
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