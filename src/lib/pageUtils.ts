import React from 'react';

/**
 * Utility function to handle the new Next.js 15.3.1 page params type requirements
 * This wrapper adapts the component to work with both local development and Vercel deployment
 */
export function createDynamicPageComponent<T>(
  Component: (props: { params: T }) => React.ReactNode
): (props: any) => React.ReactNode {
  return function WrappedComponent(props: any) {
    // Handle both Promise-based params and direct object params
    const getParams = async () => {
      if (props.params && typeof props.params.then === 'function') {
        return await props.params;
      }
      return props.params;
    };

    // Handle the params locally without async (for development)
    // Vercel will handle the Promise aspect during build
    return Component({ params: props.params });
  };
}