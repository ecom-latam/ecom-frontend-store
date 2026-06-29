'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Text } from 'zoui';
import { registerErrorModal, unregisterErrorModal } from '@/lib/errorModal';
import type { ErrorDefinition, ErrorSeverity } from '@/lib/errors';

interface ErrorModalContextValue {
  showError: (error: ErrorDefinition, retryFn?: () => void) => void;
}

const ErrorModalContext = createContext<ErrorModalContextValue>({ showError: () => {} });

export function useErrorModal() {
  return useContext(ErrorModalContext);
}

const SEVERITY_ICONS: Record<ErrorSeverity, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  alert: '🚨',
};

const SEVERITY_VARIANTS: Record<ErrorSeverity, 'outlined' | 'soft' | 'filled'> = {
  info: 'outlined',
  warning: 'soft',
  alert: 'outlined',
};

interface ErrorModalState {
  open: boolean;
  error: ErrorDefinition | null;
  onRetry: (() => void) | null;
}

export function ErrorModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<ErrorModalState>({ open: false, error: null, onRetry: null });

  const showError = useCallback((error: ErrorDefinition, retryFn?: () => void) => {
    setState({ open: true, error, onRetry: retryFn ?? null });
  }, []);

  const handleClose = useCallback(() => {
    setState(s => ({ ...s, open: false }));
  }, []);

  useEffect(() => {
    registerErrorModal(showError);
    return () => unregisterErrorModal();
  }, [showError]);

  const error = state.error;
  if (!error) return <ErrorModalContext.Provider value={{ showError }}>{children}</ErrorModalContext.Provider>;

  const severity = error.severity;
  const action = error.action;

  function handleAction() {
    handleClose();
    if (action?.retry && state.onRetry) {
      state.onRetry();
    } else if (action?.href) {
      router.push(action.href);
    }
  }

  return (
    <ErrorModalContext.Provider value={{ showError }}>
      {children}
      <Modal open={state.open} variant={SEVERITY_VARIANTS[severity]} size="sm" onClose={handleClose}>
        <Modal.Header>
          <span>{SEVERITY_ICONS[severity]}</span>{' '}
          <span data-testid="error-modal-message">{error.message}</span>
        </Modal.Header>
        <Modal.Body>
          {error.detail && (
            <Text variant="body" color="secondary">
              {error.detail}
            </Text>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button emphasis="outlined" size="sm" onClick={handleClose}>
            Cerrar
          </Button>
          {action && (action.href || (action.retry && state.onRetry)) && (
            <Button emphasis="filled" size="sm" onClick={handleAction}>
              {action.label}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </ErrorModalContext.Provider>
  );
}
