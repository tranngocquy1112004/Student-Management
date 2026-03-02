import api from './axios';

let loadingCount = 0;
let showLoadingFn = null;
let hideLoadingFn = null;

export const setupLoadingInterceptor = (showLoading, hideLoading) => {
  showLoadingFn = showLoading;
  hideLoadingFn = hideLoading;

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Skip loading for certain endpoints if needed
      if (!config.skipLoading) {
        loadingCount++;
        if (loadingCount === 1 && showLoadingFn) {
          showLoadingFn();
        }
      }
      return config;
    },
    (error) => {
      loadingCount--;
      if (loadingCount === 0 && hideLoadingFn) {
        hideLoadingFn();
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      loadingCount--;
      if (loadingCount === 0 && hideLoadingFn) {
        hideLoadingFn();
      }
      return response;
    },
    (error) => {
      loadingCount--;
      if (loadingCount === 0 && hideLoadingFn) {
        hideLoadingFn();
      }
      return Promise.reject(error);
    }
  );
};
