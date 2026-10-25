'use client';
import { useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle, X } from 'lucide-react';
import type { FormState } from '@/app/actions/auth';
export function Submit({
  children,
  className = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending && <LoaderCircle size={16} className="spin" />}
      {pending ? 'Saving…' : children}
    </button>
  );
}
export function Feedback({ state }: { state: FormState }) {
  return (
    <div aria-live="polite">
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice success">
          {state.success}
        </p>
      )}
    </div>
  );
}
export function ActionForm({
  action,
  children,
  className = '',
  submit,
  disabled,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  className?: string;
  submit?: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className} onReset={(event) => event.preventDefault()}>
      {children}
      <Feedback state={state} />
      {submit && <Submit disabled={disabled}>{submit}</Submit>}
    </form>
  );
}
export function DeleteForm({
  action,
  id,
  label,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  id: string;
  label: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="button danger ghost"
        onClick={() => dialog.current?.showModal()}
      >
        Delete {label}
      </button>
      <dialog ref={dialog} className="confirm-dialog">
        <button
          type="button"
          className="icon-button close-dialog"
          aria-label="Close confirmation"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
        <h2>Delete this {label}?</h2>
        <p>This permanently removes it from your workspace.</p>
        <ActionForm action={action} submit={`Yes, delete ${label}`}>
          <input name="id" type="hidden" value={id} />
          <input name="confirmed" type="hidden" value="true" />
        </ActionForm>
        <button type="button" className="button secondary" onClick={() => dialog.current?.close()}>
          Keep it
        </button>
      </dialog>
    </>
  );
}
