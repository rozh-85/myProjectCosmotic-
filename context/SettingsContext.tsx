
import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '../services/dbService';

interface SettingsContextType {
    logoUrl: string;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    logoUrl: '',
    refreshSettings: async () => { },
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState('');

    const refreshSettings = async () => {
        const url = await dbService.getSetting('logo_url');
        setLogoUrl(url);
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ logoUrl, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
