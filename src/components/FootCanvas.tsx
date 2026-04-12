import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Edit3, Circle } from 'lucide-react';

interface FootCanvasProps {
  initialData?: string; // base64 string
  onChange: (data: string) => void;
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Black', value: '#0a0a0a' },
];

export default function FootCanvas({ initialData, onChange }: FootCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial canvas state
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial data if present
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale coordinates based on canvas internal resolution vs css size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (!window.confirm('Deseja limpar todas as marcações?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-zinc-100 p-3 rounded-2xl">
        <div className="flex items-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                color === c.value ? 'border-zinc-950 scale-110 shadow-sm' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {color === c.value && <Circle size={12} className="text-white fill-white" />}
            </button>
          ))}
          <div className="h-6 w-px bg-zinc-300 mx-2" />
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24 accent-zinc-900"
          />
        </div>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} /> Limpar
        </button>
      </div>

      <div className="relative border-2 border-zinc-200 rounded-[2rem] overflow-hidden bg-white shadow-inner aspect-[4/3] max-w-[600px] mx-auto w-full">
        {/* Background Feet Image */}
        <img
          src="/src/assets/podology_feet_map.png"
          alt="Feet Map"
          className="absolute inset-0 w-full h-full object-contain p-4 opacity-40 select-none pointer-events-none"
        />
        
        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
      
      <p className="text-[10px] text-zinc-400 text-center uppercase tracking-widest font-bold">
        Mapeamento Visual: Use as cores para indicar condições (Vermelho: Dor, Azul: Calos, etc.)
      </p>
    </div>
  );
}
