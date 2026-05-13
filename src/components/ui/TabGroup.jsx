import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '../../utils/classNames.js'

export default function TabGroup({ tabs, value, onValueChange }) {
  return (
    <Tabs.Root className="space-y-4" value={value} onValueChange={onValueChange}>
      <Tabs.List className="flex flex-wrap gap-3 rounded-full bg-white/5 p-1">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              value === tab.value
                ? 'bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 shadow-glow'
                : 'text-slate-300 hover:text-white',
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.value} value={tab.value} className="rounded-3xl bg-white/5 p-5 text-slate-300 shadow-soft">
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
