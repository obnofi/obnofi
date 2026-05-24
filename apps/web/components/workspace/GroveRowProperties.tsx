"use client";

import { PropertyCell } from "@/components/database/PropertyCell";
import type { Property, PropertyValue, PropertyValueData } from "@obnofi/types";

interface GroveRowPropertiesProps {
  properties: Property[];
  values: PropertyValue[];
  onChange: (propertyId: string, value: PropertyValueData) => void;
}

export function GroveRowProperties({
  properties,
  values,
  onChange,
}: GroveRowPropertiesProps) {
  if (properties.length === 0) {
    return null;
  }

  const getValue = (propertyId: string) =>
    values.find(
      (propertyValue) =>
        propertyValue.propertyId === propertyId ||
        propertyValue.columnId === propertyId
    )?.value;

  return (
    <section className="mb-8">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
        속성
      </div>
      <div>
        {properties.map((property) => (
          <div
            key={property.id}
            className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-3 py-2"
          >
            <div className="truncate text-sm text-[var(--color-text-secondary)]">
              {property.name}
            </div>
            <div className="min-w-0">
              <PropertyCell
                property={property}
                value={getValue(property.id)}
                options={property.options ?? []}
                onChange={(value) => onChange(property.id, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
