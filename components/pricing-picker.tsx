'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatAttributesPicker } from '@/components/ui/seat-attributes-picker';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type PricePoint = {
  id: string;
  price: number;
  color: string;
  attributes: {
    houseSeat: boolean;
    emergency: boolean;
    premium: boolean;
    accessible: boolean;
    restrictedView: boolean;
  };
};

interface PricingPickerProps {
  pricePoints: PricePoint[];
  onChange: (pricePoints: PricePoint[]) => void;
  selectedPricePoint: PricePoint | null;
  onSelectPricePoint: (pricePoint: PricePoint | null) => void;
}

export function PricingPicker({ 
  pricePoints, 
  onChange, 
  selectedPricePoint,
  onSelectPricePoint 
}: PricingPickerProps) {
  const [newPrice, setNewPrice] = useState('');
  const [newColor, setNewColor] = useState('#0000FF');
  const [newAttributes, setNewAttributes] = useState({
    houseSeat: false,
    emergency: false,
    premium: false,
    accessible: false,
    restrictedView: false,
  });
  const [editingPoint, setEditingPoint] = useState<PricePoint | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editColor, setEditColor] = useState('#0000FF');
  const [editAttributes, setEditAttributes] = useState({
    houseSeat: false,
    emergency: false,
    premium: false,
    accessible: false,
    restrictedView: false,
  });

  const handleAddPricePoint = () => {
    if (!newPrice) return;
    
    const newPricePoint: PricePoint = {
      id: Math.random().toString(36).substr(2, 9),
      price: parseFloat(newPrice),
      color: newColor,
      attributes: newAttributes,
    };

    onChange([...pricePoints, newPricePoint]);
    setNewPrice('');
    setNewColor('#0000FF');
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
    onChange(pricePoints.filter(point => point.id !== id));
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
                onColorChange={setNewColor}
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
                            onColorChange={setEditColor}
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
                    <span className="text-[10px] bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded whitespace-nowrap">Restricted</span>
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
