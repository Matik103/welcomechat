
import React from 'react';
import { Route } from 'react-router-dom';
import { FirecrawlPage } from '@/components/firecrawl/FirecrawlPage';

export const FirecrawlRoutes = () => {
  return (
    <Route path="/firecrawl" element={<FirecrawlPage />} />
  );
};
