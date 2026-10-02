import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { nextMidnight, thisWeek, weekTotalLine } from './stats'

// Moves on at midnight, and whenever the page comes back into view, so the week is never a day behind.
function useToday() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const atMidnight = setTimeout(refresh, nextMidnight(now) - now)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(atMidnight)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [now])
  return now
}

// The stats page: this week's finished sessions, day by day. It only reads the session records.
function Stats({ records, onBack }) {
  const now = useToday()
  const week = thisWeek(records, now)
  return (
    <>
      <nav className="absolute top-0 left-0 p-screen">
        <Button variant="link" asChild>
          <a href={`/${window.location.search}`} onClick={onBack}>
            Back to forest
          </a>
        </Button>
      </nav>
      <section className="flex flex-col items-center px-screen pt-timer-top pb-gap">
        <p>{weekTotalLine(week.total)}</p>
        <table className="mt-gap border-separate border-spacing-x-gap text-center">
          <thead>
            <tr>
              {week.days.map((day) => (
                <th
                  key={day.name}
                  scope="col"
                  className={`font-normal ${day.today ? 'text-foreground' : 'text-muted-foreground'}`}
                  aria-current={day.today ? 'date' : undefined}
                >
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {week.days.map((day) => (
                <td key={day.name} className={`tabular-nums ${day.today ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {day.count}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>
    </>
  )
}

export default Stats
