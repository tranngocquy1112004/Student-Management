import { useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { setupLoadingInterceptor } from '../api/loadingInterceptor';

const LoadingInterceptorSetup = ({ children }) => {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    setupLoadingInterceptor(showLoading, hideLoading);
  }, [showLoading, hideLoading]);

  return children;
};

export default LoadingInterceptorSetup;
