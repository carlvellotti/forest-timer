import { memo } from 'react'
import Tree from './Tree'

// Every tree you've ever grown, newest first, in centered rows like treelines.
function Forest({ trees, justGrew }) {
  if (trees.length === 0) {
    return <p className="text-small text-muted-foreground">Finish a session to grow your first tree.</p>
  }
  return (
    <ul className="flex flex-wrap justify-center gap-tree-gap" aria-label="Forest">
      {trees.map((tree) => (
        <li key={tree.startedAt}>
          <Tree justGrew={tree.startedAt === justGrew?.startedAt} />
        </li>
      ))}
    </ul>
  )
}

// Only redraws when the trees or the ring change, not every second of a session.
export default memo(Forest)
