import type { AppProps } from 'next/app'
import '../styles/globals.css';
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      // Get the color-scheme value from :root
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const colorScheme = computedStyle.getPropertyValue('--mode')?.trim()?.replace(/"/g, '') || 'light';
      
      // Remove any existing theme classes first
      root.classList.remove('dark', 'light');
      
      // Add the appropriate theme class
      root.classList.add(colorScheme === 'dark' ? 'dark' : 'light');
    } catch (error) {
      console.error('Error setting theme:', error);
      // Default to light theme if there's an error
      document.documentElement.classList.add('light');
    }
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>RFI Vendor Tracker</title>
        <link rel="icon" href="/images/rect.png" />
      </Head>
      <div className="min-h-screen">
        <Component {...pageProps} />
        <Toaster />
      </div>
    </>
  )
}