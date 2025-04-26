import { SeatPlan, Section, Row, Seat } from "@/types/seat-plan";

export function normalizeSeatPositions(seatPlan: SeatPlan): SeatPlan {
    // Find the minimum x value across all seats
    const minX = Math.min(...seatPlan.sections.flatMap((section: Section) =>
        section.rows.flatMap((row: Row) =>
            row.seats.map((seat: Seat) => seat.x)
        )
    ));

    // If the minimum x is negative, shift all seats by that amount
    if (minX < 0) {
        const shiftAmount = -minX;
        return {
            ...seatPlan,
            sections: seatPlan.sections.map((section: Section) => ({
                ...section,
                rows: section.rows.map((row: Row) => ({
                    ...row,
                    seats: row.seats.map((seat: Seat) => ({
                        ...seat,
                        x: seat.x + shiftAmount
                    }))
                }))
            }))
        };
    }

    return seatPlan;
} 