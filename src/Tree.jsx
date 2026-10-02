// A soft, filled pine on a brown trunk. The tree you just grew wears the orange dashed ring.
function Tree({ justGrew }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-tree"
      role="img"
      aria-label={justGrew ? 'Tree you just grew' : 'Tree'}
    >
      {justGrew && (
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="none"
          className="stroke-accent"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <rect x="11" y="16" width="2" height="4" className="fill-trunk" />
      <polygon
        points="12,4 16,10 14.5,10 17.5,16 6.5,16 9.5,10 8,10"
        className="fill-tree stroke-tree-edge"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default Tree
