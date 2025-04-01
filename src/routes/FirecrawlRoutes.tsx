
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { FirecrawlPage } from '@/components/firecrawl/FirecrawlPage';

export const FirecrawlRoutes = () => {
  return (
    <Routes>
      <Route path="/firecrawl" element={<FirecrawlPage />} />
      <Route path="/admin/firecrawl" element={<FirecrawlPage />} />
    </Routes>
  );
};
