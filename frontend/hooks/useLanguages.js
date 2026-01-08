import { useEffect, useState } from 'react';

export function useLanguages() {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await fetch('/api/languages');
                const data = await res.json();
                if (data.success) {
                    setLanguages(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch languages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    return { languages, loading };
}
