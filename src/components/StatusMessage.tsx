import type { ReactNode } from 'react';

interface Props {
  kind: 'loading' | 'empty' | 'error' | 'no-key';
  title: string;
  children?: ReactNode;
}

export default function StatusMessage({ kind, title, children }: Props) {
  const isAlert = kind === 'error' || kind === 'no-key';
  return (
    <div className={`status status-${kind}`} role={isAlert ? 'alert' : 'status'} aria-live={isAlert ? 'assertive' : 'polite'}>
      {kind === 'loading' && <span className="spinner on" aria-hidden="true" />}
      <p className="status-title">{title}</p>
      {children && <div className="status-body">{children}</div>}
    </div>
  );
}
