'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatAttributesPicker } from '@/components/ui/seat-attributes-picker';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { SeatPlan, Section, Row, Seat } from '@/types/seat-plan';
import { toast } from 'sonner';
import { z } from 'zod';

// Predefined set of accessible colors that work well together
const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
] as const;

const DEFAULT_COLOR = DEFAULT_COLORS[0];

const attributesSchema = z.object({
  houseSeat: z.boolean(),
  emergency: z.boolean(),
  premium: z.boolean(),
  accessible: z.boolean(),
  restrictedView: z.boolean(),
});

const pricePointSchema = z.object({
  id: z.string(),
  price: z.number(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  attributes: attributesSchema,
});

export type PricePoint = z.infer<typeof pricePointSchema>;

interface PricingPickerProps {
  pricePoints: PricePoint[];
  onChange: (pricePoints: PricePoint[]) => void;
  selectedPricePoint: PricePoint | null;
  onSelectPricePoint: (pricePoint: PricePoint | null) => void;
  onSeatPlanUpdate?: (updatedSeatPlan: SeatPlan) => void;
  seatPlan: SeatPlan | null;
}

export function PricingPicker({ 
  pricePoints, 
  onChange, 
  selectedPricePoint,
  onSelectPricePoint,
  onSeatPlanUpdate,
  seatPlan
}: PricingPickerProps) {
  const [newPrice, setNewPrice] = useState('');
  const [newColor, setNewColor] = useState<string>(DEFAULT_COLOR);
  const [newAttributes, setNewAttributes] = useState({
    houseSeat: false,
    emergency: false,
    premium: false,
    accessible: false,
    restrictedView: false,
  });
  const [editingPoint, setEditingPoint] = useState<PricePoint | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editColor, setEditColor] = useState<string>(DEFAULT_COLOR);
  const [editAttributes, setEditAttributes] = useState({
    houseSeat: false,
    emergency: false,
    premium: false,
    accessible: false,
    restrictedView: false,
  });

  // Get the next available color that isn't already in use
  const getNextAvailableColor = (): string => {
    const usedColors = new Set(pricePoints.map(p => p.color));
    return DEFAULT_COLORS.find(color => !usedColors.has(color)) || DEFAULT_COLOR;
  };

  const handleAddPricePoint = () => {
    if (!newPrice) return;
    
    const newPricePoint: PricePoint = {
      id: Math.random().toString(36).substr(2, 9),
      price: parseFloat(newPrice),
      color: newColor,
      attributes: newAttributes,
    };

    // Validate the new price point
    try {
      pricePointSchema.parse(newPricePoint);
    } catch (error) {
      console.error(error);
      console.log(newPricePoint);
      toast.error('Invalid price point data');
      return;
    }

    // Check for duplicate price/attribute combinations against both current and props pricePoints
    const allPricePoints = [...pricePoints];
    const isDuplicate = allPricePoints.some(point => 
      point.price === newPricePoint.price && 
      JSON.stringify(point.attributes) === JSON.stringify(newPricePoint.attributes)
    );

    if (isDuplicate) {
      toast.error('Price point already exists');
      return;
    }

    onChange([...pricePoints, newPricePoint]);
    onSelectPricePoint(newPricePoint);
    setNewPrice('');
    setNewColor(getNextAvailableColor());
    setNewAttributes({
      houseSeat: false,
      emergency: false,
      premium: false,
      accessible: false,
      restrictedView: false,
    });
  };

  const handleEditPricePoint = (point: PricePoint) => {
    setEditingPoint(point);
    setEditPrice(point.price.toString());
    setEditColor(point.color);
    setEditAttributes(point.attributes);
  };

  const handleSaveEdit = () => {
    if (!editingPoint) return;

    const updatedPoint: PricePoint = {
      ...editingPoint,
      price: parseFloat(editPrice),
      color: editColor,
      attributes: editAttributes,
    };

    onChange(pricePoints.map(p => p.id === editingPoint.id ? updatedPoint : p));
    setEditingPoint(null);
  };

  const handleRemovePricePoint = (id: string) => {
    const pricePointToRemove = pricePoints.find(point => point.id === id);
    if (!pricePointToRemove || !seatPlan) {
      onChange(pricePoints.filter(point => point.id !== id));
      return;
    }

    // Update seat plan to set price to null for all seats with the removed price
    const updatedSeatPlan = {
      ...seatPlan,
      sections: seatPlan.sections.map((section: Section) => ({
        ...section,
        rows: section.rows.map((row: Row) => ({
          ...row,
          seats: row.seats.map((seat: Seat) => ({
            ...seat,
            price: seat.price === pricePointToRemove.price ? null : seat.price
          }))
        }))
      }))
    };

    onChange(pricePoints.filter(point => point.id !== id));
    onSeatPlanUpdate?.(updatedSeatPlan);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Price Points</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-end gap-1">
            <div className="flex-1 space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">Price</Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter price"
                min="0"
                step="0.01"
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-center h-9">
              <SeatAttributesPicker
                color={newColor}
                onColorChange={(color: string) => setNewColor(color as string)}
                attributes={newAttributes}
                onAttributesChange={setNewAttributes}
              />
            </div>
          </div>
          <Button
            onClick={handleAddPricePoint}
            disabled={!newPrice}
            className="w-full"
          >
            Add Price Point
          </Button>
          
          <div className="space-y-2">
            {[...pricePoints]
              .sort((a, b) => a.price - b.price)
              .map((point) => (
              <div
                key={point.id}
                className="flex flex-col gap-2 p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="w-5 h-5 rounded-full border-4"
                      style={{ 
                        backgroundColor: point.color,
                        borderColor: selectedPricePoint?.id === point.id ? 'black' : 'transparent'
                      }}
                      onClick={() => onSelectPricePoint(point)}
                    />
                    {editingPoint?.id === point.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24"
                          />
                          <SeatAttributesPicker
                            color={editColor}
                            onColorChange={(color: string) => setEditColor(color as string)}
                            attributes={editAttributes}
                            onAttributesChange={setEditAttributes}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingPoint(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <span className="font-medium">${point.price.toFixed(2)}</span>
                    )}
                  </div>
                  {editingPoint?.id !== point.id && (
                    <div className="flex gap-2">
                      <IconEdit
                        size="20"
                        onClick={() => handleEditPricePoint(point)}
                      />
                      <IconTrash
                        size="20"
                        onClick={() => handleRemovePricePoint(point.id)}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {point.attributes.houseSeat && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded whitespace-nowrap">House</span>
                  )}
                  {point.attributes.emergency && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded whitespace-nowrap">Emergency</span>
                  )}
                  {point.attributes.premium && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded whitespace-nowrap">Premium</span>
                  )}
                  {point.attributes.accessible && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded whitespace-nowrap">Accessible</span>
                  )}
                  {point.attributes.restrictedView && (
                    <span className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap">Restricted View</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
