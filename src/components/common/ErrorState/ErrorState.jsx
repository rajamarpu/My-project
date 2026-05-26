import Button from '../Button/Button.jsx'

export default function ErrorState({ title = 'Something went wrong', message = 'Please try again.', onRetry }) {
  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-red-100">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm opacity-80">{message}</p>
      {onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Retry</Button> : null}
    </div>
  )
}
