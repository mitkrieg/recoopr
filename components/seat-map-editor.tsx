import { SeatMap } from "@/components/seat-map"
import { PricingPicker, PricePoint } from "@/components/pricing-picker"
import { SeatPlan } from "@/types/seat-plan"
import { Card } from "./ui/card"

type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

interface SeatMapEditorProps {
  theater: Theater
  pricePoints: PricePoint[]
  selectedPricePoint: PricePoint | null
  onSeatClick: (sectionId: number, rowId: number, seatId: number) => void
  seatPlan: SeatPlan | null
  onPricePointsChange: (pricePoints: PricePoint[]) => void
  onPricePointSelect: (pricePoint: PricePoint | null) => void
  onSeatPlanUpdate?: (updatedSeatPlan: SeatPlan) => void
}

export function SeatMapEditor({
  theater,
  pricePoints,
  selectedPricePoint,
  onSeatClick,
  seatPlan,
  onPricePointsChange,
  onPricePointSelect,
  onSeatPlanUpdate
}: SeatMapEditorProps) {
  return (
    <div className="flex gap-4 w-full">
      <Card className="flex-1 p-4">
        <SeatMap 
          theater={theater} 
          pricePoints={pricePoints}
          selectedPricePoint={selectedPricePoint}
          onSeatClick={onSeatClick}
          seatPlan={seatPlan}
        />
      </Card>
      <div className="w-60 shrink-0">
        <div className="sticky top-4">
          <PricingPicker 
            pricePoints={pricePoints} 
            onChange={onPricePointsChange}
            selectedPricePoint={selectedPricePoint}
            onSelectPricePoint={onPricePointSelect}
            onSeatPlanUpdate={onSeatPlanUpdate}
            seatPlan={seatPlan}
          />
        </div>
      </div>
    </div>
  )
} 