import { useState, useEffect } from 'react';
import type { SelectOption } from '@/components/searchable-select';

interface PhCity {
    id: number;
    name: string;
    zip_code: string | null;
    is_city: boolean;
}

interface PhBarangay {
    id: number;
    name: string;
}

export interface UsePhLocationsReturn {
    provinces: SelectOption[];
    cities: SelectOption[];
    barangays: SelectOption[];
    loadingProvinces: boolean;
    loadingCities: boolean;
    loadingBarangays: boolean;
    getZipCode: (cityId: number | string) => string;
    setCityId: (id: number | null) => void;
    setProvinceId: (id: number | null) => void;
}

export function usePhLocations(): UsePhLocationsReturn {
    const [provinces, setProvinces] = useState<SelectOption[]>([]);
    const [cities, setCities] = useState<SelectOption[]>([]);
    const [barangays, setBarangays] = useState<SelectOption[]>([]);
    const [cityMap, setCityMap] = useState<Record<number, PhCity>>({});

    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    const [provinceId, setProvinceIdState] = useState<number | null>(null);
    const [cityId, setCityIdState] = useState<number | null>(null);

    // Fetch provinces once on mount
    useEffect(() => {
        setLoadingProvinces(true);
        fetch('/api/locations/provinces')
            .then(r => r.json())
            .then((data: Array<{ id: number; name: string; region: string }>) => {
                setProvinces(
                    data.map(p => ({
                        value: p.id,
                        label: p.name,
                        meta: p.region,
                    }))
                );
            })
            .catch(console.error)
            .finally(() => setLoadingProvinces(false));
    }, []);

    // Fetch cities whenever province changes
    useEffect(() => {
        if (provinceId === null) {
            setCities([]);
            setCityMap({});
            setBarangays([]);
            return;
        }
        setLoadingCities(true);
        setCities([]);
        setCityMap({});
        setBarangays([]);
        fetch(`/api/locations/cities/${provinceId}`)
            .then(r => r.json())
            .then((data: PhCity[]) => {
                const map: Record<number, PhCity> = {};
                data.forEach(c => {
                    map[c.id] = c;
                });
                setCityMap(map);
                setCities(
                    data.map(c => ({
                        value: c.id,
                        // Avoid double "City of City of"
                        label: c.name.toLowerCase().startsWith('city of')
                            ? c.name
                            : c.is_city
                            ? `${c.name} (City)`
                            : c.name,
                        meta: c.zip_code ?? undefined,
                    }))
                );
            })
            .catch(console.error)
            .finally(() => setLoadingCities(false));
    }, [provinceId]);

    // Fetch barangays whenever city changes
    useEffect(() => {
        if (cityId === null) {
            setBarangays([]);
            return;
        }
        setLoadingBarangays(true);
        setBarangays([]);
        fetch(`/api/locations/barangays/${cityId}`)
            .then(r => r.json())
            .then((data: PhBarangay[]) => {
                setBarangays(
                    data.map(b => ({
                        value: b.id,
                        label: b.name,
                    }))
                );
            })
            .catch(console.error)
            .finally(() => setLoadingBarangays(false));
    }, [cityId]);

    const setProvinceId = (id: number | null) => {
        setProvinceIdState(id);
        // Reset city when province changes
        setCityIdState(null);
    };

    const setCityId = (id: number | null) => {
        setCityIdState(id);
    };

    const getZipCode = (id: number | string): string => {
        return cityMap[Number(id)]?.zip_code ?? '';
    };

    return {
        provinces,
        cities,
        barangays,
        loadingProvinces,
        loadingCities,
        loadingBarangays,
        getZipCode,
        setCityId,
        setProvinceId,
    };
}