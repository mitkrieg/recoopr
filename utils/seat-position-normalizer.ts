import { SeatPlan, Section, Row, Seat } from "@/types/seat-plan";

export function normalizeSeatPositions(seatPlan: SeatPlan): SeatPlan {
    // Group sections by parentSection
    const sectionsByParent: Record<string, Section[]> = seatPlan.sections.reduce((acc, section) => {
        const parentKey = section.parentSection || 'Main';
        if (!acc[parentKey]) {
            acc[parentKey] = [];
        }
        acc[parentKey].push(section);
        return acc;
    }, {} as Record<string, Section[]>);
    
    // Find the minimum x and y for each parent section group
    const parentMinX: Record<string, number> = {};
    const parentMinY: Record<string, number> = {};
    
    for (const [parentKey, sections] of Object.entries(sectionsByParent)) {
        parentMinX[parentKey] = Math.min(...sections.flatMap(section => 
            section.rows.flatMap(row => 
                row.seats.map(seat => seat.x)
            )
        ));
        parentMinY[parentKey] = Math.min(...sections.flatMap(section => 
            section.rows.flatMap(row => 
                row.seats.map(seat => seat.y)
            )
        ));
    }
    
    // Normalize each section based on its parent section's minimum x and y
    return {
        ...seatPlan,
        sections: seatPlan.sections.map(section => {
            const parentKey = section.parentSection || 'Main';
            const shiftAmountX = parentMinX[parentKey];
            const shiftAmountY = parentMinY[parentKey];
            
            return {
                ...section,
                rows: section.rows.map(row => ({
                    ...row,
                    seats: row.seats.map(seat => ({
                        ...seat,
                        x: seat.x - shiftAmountX + 10,
                        y: seat.y - shiftAmountY + 15 // Set topmost seat to y=5
                    }))
                }))
            };
        })
    };
} 