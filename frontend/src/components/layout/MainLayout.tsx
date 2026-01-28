import React from 'react';
import { Header } from './Header';
import { Layout } from './Layout';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title 
}) => {
  return (
    <Layout>
      <Header title={title} />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </Layout>
  );
};