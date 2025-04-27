'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatAttributesPicker } from '@/components/ui/seat-attributes-picker';

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
}

export function PricingPicker({ pricePoints, onChange }: PricingPickerProps) {
  const [newPrice, setNewPrice] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [newAttributes, setNewAttributes] = useState({
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
    setNewColor('#000000');
    setNewAttributes({
      houseSeat: false,
      emergency: false,
      premium: false,
      accessible: false,
      restrictedView: false,
    });
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
            {pricePoints.map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: point.color }}
                  />
                  <div className="space-y-1">
                    <span className="font-medium">${point.price.toFixed(2)}</span>
                    <div className="flex gap-2">
                      {point.attributes.houseSeat && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">House</span>
                      )}
                      {point.attributes.emergency && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Emergency</span>
                      )}
                      {point.attributes.premium && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Premium</span>
                      )}
                      {point.attributes.accessible && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Accessible</span>
                      )}
                      {point.attributes.restrictedView && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Restricted</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePricePoint(point.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
