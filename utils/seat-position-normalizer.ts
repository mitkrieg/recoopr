import { SeatPlan, Section} from "@/types/seat-plan";

export function normalizeSeatPositions(seatPlan: SeatPlan): SeatPlan {
    console.log(`Normalizing seat positions for ${seatPlan.theater.name}`);
    
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
                row.seats.map(seat => seat.x).filter((x): x is number => x !== null)
            )
        ));
        parentMinY[parentKey] = Math.min(...sections.flatMap(section => 
            section.rows.flatMap(row => 
                row.seats.map(seat => seat.y).filter((y): y is number => y !== null)
            )
        ));
        // console.log(`Section group ${parentKey} - Min X: ${parentMinX[parentKey]}, Min Y: ${parentMinY[parentKey]}`);
    }
    
    // Normalize each section based on its parent section's minimum x and y
    return {
        ...seatPlan,
        sections: seatPlan.sections.map(section => {
            const parentKey = section.parentSection || 'Main';
            const shiftAmountX = parentMinX[parentKey];
            const shiftAmountY = parentMinY[parentKey];
            
            // console.log(`Normalizing section "${section.label}" - Shifting X by ${shiftAmountX}, Y by ${shiftAmountY}`);
            
            // Additional shift for MEZZANINE REAR LEFT in Al Hirschfeld Theatre
            const additionalShiftX = 
                seatPlan.theater.name === "Al Hirschfeld Theatre" && 
                section.label === "MEZZANINE REAR LEFT" ? 20 : 0;
            
            return {
                ...section,
                rows: section.rows.map(row => ({
                    ...row,
                    seats: row.seats.map(seat => ({
                        ...seat,
                        x: seat.x !== null ? seat.x - shiftAmountX + 10 - additionalShiftX : null,
                        y: seat.y !== null ? seat.y - shiftAmountY + 60 : null
                    }))
                }))
            };
        })
    };
} 