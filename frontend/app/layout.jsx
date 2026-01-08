import './globals.css';

export const metadata = {
    metadataBase: new URL('https://goskyturkey.com'),
    title: {
        default: 'GoSkyTurkey | Yamaç Paraşütü, Gyrocopter ve Balon Turları',
        template: '%s | GoSkyTurkey',
    },
    description: 'İzmir, Denizli-Pamukkale, Fethiye-Ölüdeniz ve Manisa\'da yamaç paraşütü, gyrocopter ve balon turları.',
};

export default function RootLayout({ children }) {
    return children;
}
