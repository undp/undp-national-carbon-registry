import { useEffect, useState } from "react";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../../Config/apiConfig";

export interface CountryOption {
  label: string;
  value: string;
}

// Fetches the full configured country list once (GET national/organisation/countries,
// { alpha2, name } rows) and exposes it as antd Select options plus a code -> name
// lookup, so country codes stored on cooperative approaches / authorized entities can
// be rendered as names. Mirrors the mapping previously duplicated inline in
// creditActionModal.tsx's loadCounterparties().
export const useCountryOptions = () => {
  const { get } = useConnection();
  const [options, setOptions] = useState<CountryOption[]>([]);
  const [byCode, setByCode] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCountries = async () => {
      setLoading(true);
      try {
        const response = await get(API_PATHS.COUNTRIES);
        const countries: { alpha2: string; name: string }[] =
          response?.data ?? [];
        if (cancelled) return;
        setByCode(new Map(countries.map((c) => [c.alpha2, c.name])));
        setOptions(
          countries.map((c) => ({ label: c.name, value: c.alpha2 }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCountries();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { options, byCode, loading };
};
