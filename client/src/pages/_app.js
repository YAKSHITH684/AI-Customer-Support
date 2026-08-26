import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { useAuthStore } from '../store/authStore';
import LiveChatWidget from '../components/LiveChatWidget';

export default function MyApp({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Head>
        <title>ResolveFlow_AI — Autonomous Customer Support Platform</title>
        <meta
          name="description"
          content="Enterprise-grade AI customer support platform powered by Multi-Agent RAG Orchestration, real-time telemetry, and OAuth integrations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <LiveChatWidget />
    </>
  );
}
