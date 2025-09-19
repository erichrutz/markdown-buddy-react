import { useEffect, useState, useCallback, useRef } from 'react';
import { MarkdownFile } from '../types';

export const useFileChangeDetection = (file: MarkdownFile | null) => {
  const [hasChanged, setHasChanged] = useState(false);
  const originalContentRef = useRef<string | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store original content when file changes
  useEffect(() => {
    if (file) {
      // Reset change state for new file
      setHasChanged(false);
      originalContentRef.current = null;
      
      // Store original content
      file.file.text()
        .then(content => {
          originalContentRef.current = content;
        })
        .catch(error => {
          console.error('Error reading original file content:', error);
        });
    } else {
      setHasChanged(false);
      originalContentRef.current = null;
    }
  }, [file?.path]); // Reset when file path changes

  // Check for changes function
  const checkForChanges = useCallback(async (): Promise<boolean> => {
    if (!file || !originalContentRef.current) {
      return false;
    }

    try {
      const currentContent = await file.file.text();
      const changed = currentContent !== originalContentRef.current;
      
      if (changed !== hasChanged) {
        setHasChanged(changed);
      }
      
      return changed;
    } catch (error) {
      console.error('Error checking for file changes:', error);
      return false;
    }
  }, [file, hasChanged]);

  // Auto-check for changes every 10 seconds
  useEffect(() => {
    if (file && originalContentRef.current) {
      checkIntervalRef.current = setInterval(checkForChanges, 10000);
      
      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      };
    }
  }, [file, checkForChanges]);

  // Manual check function
  const manualCheck = useCallback(async () => {
    return await checkForChanges();
  }, [checkForChanges]);

  // Reset change state (call after successful refresh)
  const resetChangeState = useCallback(() => {
    if (file) {
      setHasChanged(false);
      // Update original content reference
      file.file.text()
        .then(content => {
          originalContentRef.current = content;
        })
        .catch(error => {
          console.error('Error updating original content reference:', error);
        });
    }
  }, [file]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    hasChanged,
    checkForChanges: manualCheck,
    resetChangeState
  };
};