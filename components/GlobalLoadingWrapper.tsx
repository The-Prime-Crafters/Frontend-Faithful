import { useLoading } from '@/contexts/LoadingContext';
import React from 'react';
import GlobalLoader from './GlobalLoader';

interface GlobalLoadingWrapperProps {
  children: React.ReactNode;
}

export default function GlobalLoadingWrapper({ children }: GlobalLoadingWrapperProps) {
  const { isLoading, loadingText } = useLoading();

  return (
    <>
      {children}
      <GlobalLoader visible={isLoading} text={loadingText} />
    </>
  );
}
