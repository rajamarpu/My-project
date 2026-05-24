import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export default function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-colors dark:bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-glow backdrop-blur-xl dark:border-white/10 light:border-black/10 light:bg-white/95 light:backdrop-blur-none">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-white dark:text-white light:text-slate-900">{title}</h3>
            <Dialog.Close asChild>
              <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 dark:bg-white/5 light:bg-black/5 light:border-black/10 light:text-slate-900 light:hover:bg-black/10">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-4 text-slate-200 dark:text-slate-200 light:text-slate-700">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
