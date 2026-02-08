// Componente de input para montos en COP.
// Muestra el número con separador de miles (10.000) mientras escribes.
// Internamente guarda el valor numérico limpio para enviar al backend.

import { useState, useEffect } from "react";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

// Formatea un número con puntos como separador de miles: 1000000 -> 1.000.000
function formatWithDots(num: number): string {
  if (num === 0) return "";
  return num.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

// Quita todo lo que no sea dígito y convierte a número
function parseClean(text: string): number {
  const cleaned = text.replace(/\D/g, "");
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

export default function MoneyInput({
  value,
  onChange,
  className = "",
  placeholder = "0",
  required = false,
}: MoneyInputProps) {
  const [display, setDisplay] = useState(formatWithDots(value));

  // Sincronizar cuando el valor cambia desde fuera (ej: resetear formulario)
  useEffect(() => {
    setDisplay(formatWithDots(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numericValue = parseClean(raw);

    // Limitar a un máximo razonable (999 mil millones COP)
    if (numericValue > 999999999999) return;

    setDisplay(formatWithDots(numericValue));
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        required={required}
        className={`pl-7 ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
}
