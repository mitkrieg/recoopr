export type Theater = {
    id: number;
    name: string;
    venueSlug: string | null;
}

export type Seat = {
    id: number;
    seatNumber: string;
    displayNumber: string | null;
    price: number | null;
    status: string | null;
    accessible: boolean | null;
    x: number | null;
    y: number | null;
    attributes?: {
        houseSeat: boolean;
        emergency: boolean;
        premium: boolean;
        accessible: boolean;
        restrictedView: boolean;
    };
}

export type Row = {
    id: number;
    label: string;
    displayLabel: string | null;
    sectionId: number;
    seats: Seat[];
}

export type Section = {
    id: number;
    name: string;
    categoryKey: number | null;
    color: string | null;
    theaterId: number;
    parentSection: string | null;
    label: string;
    rows: Row[];
}

export type SeatPlan = {
    theater: Theater;
    sections: Section[];
} 