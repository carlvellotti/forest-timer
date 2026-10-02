import { useEffect } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTimeLeft, tabTitle } from './session-keeper'
import { useSessionKeeper } from './use-session-keeper'

function App() {
  const { running, timeLeft, start } = useSessionKeeper()

  useEffect(() => {
    document.title = tabTitle(running, timeLeft)
  }, [running, timeLeft])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-gap p-screen">
      <p className="text-timer tabular-nums" role="timer">
        {formatTimeLeft(timeLeft)}
      </p>
      {running ? (
        <Button variant="link">Give up</Button>
      ) : (
        <Button onClick={start}>
          <Play className="fill-current" strokeWidth={0} aria-hidden="true" />
          Start
        </Button>
      )}
    </main>
  )
}

export default App
