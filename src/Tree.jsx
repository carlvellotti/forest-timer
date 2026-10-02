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
      {/* The pine fills most of the square, staying just inside the ring */}
      <rect x="10.8" y="16.8" width="2.4" height="4.8" className="fill-trunk" />
      <polygon
        points="12,2.4 16.8,9.6 15,9.6 18.6,16.8 5.4,16.8 9,9.6 7.2,9.6"
        className="fill-tree stroke-tree-edge"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default Tree
