// What every tab but the first shows (rule 8): just this line, no timer and no buttons.
function AnotherTab() {
  return (
    <main className="flex min-h-svh items-center justify-center p-screen">
      <p className="text-muted-foreground">Forest Timer is open in another tab.</p>
    </main>
  )
}

export default AnotherTab
