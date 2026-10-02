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

  const onFinished = useCallback((record) => {
    setRecords(loadSessionRecords())
    setJustGrew(record)
  }, [])

  const trees = useMemo(() => treesFrom(records), [records])

  const { running, timeLeft, start } = useSessionKeeper({ onFinished })

  useEffect(() => {
    document.title = tabTitle(running, timeLeft)
  }, [running, timeLeft])

  function startSession() {
    setJustGrew(null)
    start()
  }

  return (
    <main className="flex min-h-svh flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-gap p-screen">
        <p className="text-timer tabular-nums" role="timer">
          {formatTimeLeft(timeLeft)}
        </p>
        {running ? (
          <Button variant="link">Give up</Button>
        ) : (
          <Button onClick={startSession}>
            <Play className="fill-current" strokeWidth={0} aria-hidden="true" />
            Start
          </Button>
        )}
      </section>
      <section className="border-t border-line p-screen">
        <Forest trees={trees} justGrew={justGrew} />
      </section>
    </main>
  )
}

export default App
