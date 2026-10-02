import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { loadSessionRecords, treesFrom } from './browser-storage'
import Forest from './Forest'
import { formatTimeLeft, tabTitle } from './session-keeper'
import { sessionFinishedOnOpening, useSessionKeeper } from './use-session-keeper'

function App() {
  // The tree you just grew keeps its ring until you press Start again or leave the page.
  // That includes a session that finished while the page was away (rule 5), which is
  // settled first, so the forest loaded below already has its tree.
  const [justGrew, setJustGrew] = useState(sessionFinishedOnOpening)
  const [records, setRecords] = useState(loadSessionRecords)
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
    <main className="min-h-svh">
      {/* The timer sits a third of the way down and stays put; the forest starts right under its buttons */}
      <section className="flex flex-col items-center px-screen pt-timer-top pb-gap">
        <p className="text-timer tabular-nums" role="timer">
          {formatTimeLeft(timeLeft)}
        </p>
        {/* Always as tall as the question, so asking never moves the line or the forest */}
        <div className="grid pt-gap *:col-start-1 *:row-start-1">
          <div className="invisible flex flex-col items-center gap-gap" aria-hidden="true" inert>
            <p>&nbsp;</p>
            <Button tabIndex={-1}>&nbsp;</Button>
          </div>
          <div className="flex flex-col items-center gap-gap">
            {!running ? (
              <Button onClick={startSession}>Start</Button>
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
        </div>
      </section>
      <section className="border-t border-line p-screen">
        <Forest trees={trees} justGrew={justGrew} />
      </section>
    </main>
  )
}

export default App
