
import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '../services/dbService';

interface SettingsContextType {
    logoUrl: string;
    bannerDuration: number;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    logoUrl: '',
    bannerDuration: 4000,
    refreshSettings: async () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState('');
    const [bannerDuration, setBannerDuration] = useState(4000);

    const refreshSettings = async () => {
        const [url, duration] = await Promise.all([
            dbService.getSetting('logo_url'),
            dbService.getSetting('banner_duration')
        ]);
        setLogoUrl(url);
        if (duration) setBannerDuration(parseInt(duration));
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ logoUrl, bannerDuration, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
