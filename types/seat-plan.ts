export type Theater = {
    id: number;
    name: string;
    venueSlug: string | null;
}

export type Seat = {
    id: number;
    seatNumber: string;
    displayNumber: string;
    price: number | null;
    status: string;
    accessible: boolean;
    x: number;
    y: number;
}

export type Row = {
    id: number;
    label: string;
    displayLabel: string | null;
    seats: Seat[];
}

export type Section = {
    id: number;
    name: string;
    categoryKey: number | null;
    color: string | null;
    label: string;
    parentSection: string | null;
    rows: Row[];
}

export type SeatPlan = {
    theater: Theater;
    sections: Section[];
} 