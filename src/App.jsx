import { useCallback, useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadSessionRecords, treesFrom } from './browser-storage'
import Forest from './Forest'
import { formatTimeLeft, tabTitle } from './session-keeper'
import { useSessionKeeper } from './use-session-keeper'

function App() {
  const [records, setRecords] = useState(loadSessionRecords)
  // The tree you just grew keeps its ring until you press Start again or leave the page.
  const [justGrew, setJustGrew] = useState(null)
  // Rule 3: Give up asks once, in place, before it ends the session.
  const [askingToGiveUp, setAskingToGiveUp] = useState(false)

  const onEnded = useCallback((record) => {
    setRecords(loadSessionRecords())
    setAskingToGiveUp(false)
    if (record.ended === 'finished') setJustGrew(record)
  }, [])

  const trees = useMemo(() => treesFrom(records), [records])

  const { running, timeLeft, start, giveUp } = useSessionKeeper({ onEnded })

  useEffect(() => {
    document.title = tabTitle(running, timeLeft)
  }, [running, timeLeft])

  function startSession() {
    setJustGrew(null)
    setAskingToGiveUp(false)
    start()
  }

  return (
    <main className="flex min-h-svh flex-col">
      {/* The timer stays centered; what's under it hangs below, so asking never moves it */}
      <section className="grid flex-1 grid-rows-[1fr_auto_1fr] justify-items-center p-screen">
        <p className="row-start-2 text-timer tabular-nums" role="timer">
          {formatTimeLeft(timeLeft)}
        </p>
        <div className="row-start-3 flex flex-col items-center gap-gap pt-gap">
          {!running ? (
            <Button onClick={startSession}>
              <Play className="fill-current" strokeWidth={0} aria-hidden="true" />
              Start
            </Button>
          ) : askingToGiveUp ? (
            <>
              <p className="text-muted-foreground" role="status">
                Give up? No tree this time.
              </p>
              <div className="flex items-center gap-gap">
                <Button autoFocus onClick={() => setAskingToGiveUp(false)}>
                  Keep going
                </Button>
                <Button variant="link" onClick={giveUp}>
                  Give up
                </Button>
              </div>
            </>
          ) : (
            <Button variant="link" onClick={() => setAskingToGiveUp(true)}>
              Give up
            </Button>
          )}
        </div>
      </section>
      <section className="border-t border-line p-screen">
        <Forest trees={trees} justGrew={justGrew} />
      </section>
    </main>
  )
}

export default App
