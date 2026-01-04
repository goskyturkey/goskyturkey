const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://goskyturkey.com/api';

// Server-side fetch with revalidation
export async function getActivities() {
    try {
        const res = await fetch(`${API_URL}/activities`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

export async function getActivity(slug) {
    try {
        const res = await fetch(`${API_URL}/activities/slug/${slug}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) throw new Error('Failed to fetch activity');
        return res.json();
    } catch (error) {
        console.error('Error fetching activity:', error);
        return null;
    }
}

export async function getSettings() {
    try {
        const res = await fetch(`${API_URL}/settings`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

// Client-side API calls
export const clientApi = {
    createBooking: async (bookingData) => {
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });
        return res.json();
    },

    initiatePayment: async (bookingId) => {
        const res = await fetch(`${API_URL}/payment/initiate/${bookingId}`, {
            method: 'POST',
        });
        return res.json();
    },
};
