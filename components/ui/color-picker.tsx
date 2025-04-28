'use client';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      className="w-7 h-7 rounded-full border-2 border-white shadow cursor-pointer"
      style={{
        backgroundColor: color,
        // outline: color === color ? "2px solid black" : "none",

      }}
    />
  );
} 