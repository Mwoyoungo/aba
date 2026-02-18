"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps";

export interface PlaceResult {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

interface Props {
  onSelect: (result: PlaceResult) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function PlacesAutocomplete({
  onSelect,
  defaultValue = "",
  placeholder = "Search your business address...",
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  /* Load Maps API then wire up Autocomplete */
  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "address_components", "name"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Extract city from address components
      const cityComp = place.address_components?.find((c) =>
        c.types.includes("locality") ||
        c.types.includes("sublocality") ||
        c.types.includes("administrative_area_level_2")
      );
      const city = cityComp?.long_name ?? "";
      const address = place.formatted_address ?? place.name ?? "";

      setValue(address);
      onSelect({ address, city, lat, lng });
    });

    return () => google.maps.event.removeListener(listener);
  }, [ready, onSelect]);

  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl z-10">
        {ready ? "location_on" : "hourglass_empty"}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={ready ? placeholder : "Loading Maps..."}
        disabled={!ready}
        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50 ${className}`}
      />
    </div>
  );
}
