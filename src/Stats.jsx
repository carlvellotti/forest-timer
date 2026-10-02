import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NO_STREAK_LINE, nextMidnight, streak, thisWeek, weekTotalLine } from './stats'

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

// The stats page: your streak, big, with this week's finished sessions under it. It only reads the session records.
function Stats({ records, onBack }) {
  const now = useToday()
  const week = thisWeek(records, now)
  const days = streak(records, now)
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
        {/* The page's one big thing, where the timer sits; at zero, a quiet line that never scolds */}
        {days > 0 ? (
          // DESIGN.md: the number at the timer's size, "day streak" under it in body text, so it fits a phone
          <p className="flex flex-col items-center">
            <span className="text-timer tabular-nums">{days}</span>
            <span>
              <span className="sr-only">-</span>day streak
            </span>
          </p>
        ) : (
          <p className="text-center">{NO_STREAK_LINE}</p>
        )}
        <p className="mt-gap">{weekTotalLine(week.total)}</p>
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
