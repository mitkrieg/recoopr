'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ColorPicker } from './color-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Pipette } from "lucide-react";

interface SeatAttributesPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  attributes: {
    houseSeat: boolean;
    emergency: boolean;
    premium: boolean;
    accessible: boolean;
    restrictedView: boolean;
  };
  onAttributesChange: (attributes: {
    houseSeat: boolean;
    emergency: boolean;
    premium: boolean;
    accessible: boolean;
    restrictedView: boolean;
  }) => void;
}

const DEFAULT_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e42", // orange
  "#f43f5e", // red
  "#a855f7", // purple
  "#fcf003", // yellow
  "#64748b", // slate
  "#000000", // black
  "#0000FF", // darkblue
];

export function SeatAttributesPicker({
  color,
  onColorChange,
  attributes,
  onAttributesChange,
}: SeatAttributesPickerProps) {
  const [open, setOpen] = useState(false);

  const handleAttributeChange = (key: keyof typeof attributes) => {
    onAttributesChange({
      ...attributes,
      [key]: !attributes[key],
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-7 w-7 p-0">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-4 space-y-4">
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-7 h-7 rounded-full border-2 border-white shadow"
                style={{
                  backgroundColor: c,
                  outline: color === c ? "2px solid black" : "none",
                }}
                aria-label={`Select color ${c}`}
                onClick={() => onColorChange(c)}
              />
            ))}
            <div className="relative">
              <ColorPicker color={color} onChange={onColorChange} />
              <Pipette color="white" className="absolute top-1 right-1 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="house-seat">House Seat</Label>
            <Switch
              id="house-seat"
              checked={attributes.houseSeat}
              onCheckedChange={() => handleAttributeChange('houseSeat')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emergency">Emergency</Label>
            <Switch
              id="emergency"
              checked={attributes.emergency}
              onCheckedChange={() => handleAttributeChange('emergency')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="premium">Premium</Label>
            <Switch
              id="premium"
              checked={attributes.premium}
              onCheckedChange={() => handleAttributeChange('premium')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="accessible">Accessible</Label>
            <Switch
              id="accessible"
              checked={attributes.accessible}
              onCheckedChange={() => handleAttributeChange('accessible')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="restricted-view">Restricted View</Label>
            <Switch
              id="restricted-view"
              checked={attributes.restrictedView}
              onCheckedChange={() => handleAttributeChange('restrictedView')}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 