"use client";

import { useCallback } from "react";

export function useThemedToast() {
  const createToast = useCallback((message: string, type: 'success' | 'error') => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    const baseClasses = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm transition-all duration-300 transform translate-x-full opacity-0';
    const typeClasses = type === 'success' 
      ? 'bg-green-500 border-l-4 border-green-600' 
      : 'bg-red-500 border-l-4 border-red-600';
    
    notification.className = `${baseClasses} ${typeClasses}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'absolute top-1 right-2 text-white hover:text-gray-200 text-xl font-bold cursor-pointer';
    closeBtn.onclick = () => removeToast();
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    const removeToast = () => {
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    };
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast();
    }, 4000);
  }, []);

  const success = useCallback((message: string) => {
    createToast(message, 'success');
  }, [createToast]);

  const error = useCallback((message: string) => {
    createToast(message, 'error');
  }, [createToast]);

  return { success, error };
}
