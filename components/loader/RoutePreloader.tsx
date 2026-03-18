type RoutePreloaderProps = {
  isVisible: boolean;
};

export function RoutePreloader({ isVisible }: RoutePreloaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white/96 backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_28%)]" />

      <style>{`
        .ehub-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          animation: ehubGlobalFade 3.5s infinite;
        }

        .ehub-loader svg {
          width: 120px;
          height: 120px;
          display: block;
          overflow: visible;
        }

        .path-hex {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: drawHex 2.2s ease-in-out infinite;
        }

        .path-base-line {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: drawBaseLine 2.2s ease-in-out infinite;
        }

        .path-trunk {
          stroke-dasharray: 85;
          stroke-dashoffset: 85;
          animation: drawTrunk 2.2s ease-in-out infinite;
        }

        .path-branch-1 {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawB1 2.2s ease-in-out infinite;
        }

        .path-branch-2 {
          stroke-dasharray: 45;
          stroke-dashoffset: 45;
          animation: drawB2 2.2s ease-in-out infinite;
        }

        .path-branch-3 {
          stroke-dasharray: 45;
          stroke-dashoffset: 45;
          animation: drawB3 2.2s ease-in-out infinite;
        }

        .path-branch-4 {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawB4 2.2s ease-in-out infinite;
        }

        .pop-rect-1 {
          transform-origin: center top;
          animation: popBase1 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .pop-rect-2 {
          transform-origin: center top;
          animation: popBase2 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .node {
          transform-box: fill-box;
          transform-origin: center;
        }

        .node-top {
          animation: popN1 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .node-left-up {
          animation: popN2 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .node-right-up {
          animation: popN3 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .node-left-low {
          animation: popN4 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .node-right-low {
          animation: popN5 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
        }

        .ehub-text {
          font-size: 15px;
          font-weight: 700;
          color: black;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          clip-path: inset(0 100% 0 0);
          animation: revealText 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          text-shadow: 0 0 18px rgba(16, 49, 84, 0.35);
        }

        .ehub-text span {
          color: #da8530;
        }

        @keyframes drawHex {
          0%, 5% { stroke-dashoffset: 600; }
          25%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawBaseLine {
          0%, 15% { stroke-dashoffset: 120; }
          30%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawTrunk {
          0%, 25% { stroke-dashoffset: 85; }
          40%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawB1 {
          0%, 35% { stroke-dashoffset: 40; }
          45%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawB2 {
          0%, 38% { stroke-dashoffset: 45; }
          48%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawB3 {
          0%, 40% { stroke-dashoffset: 45; }
          50%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes drawB4 {
          0%, 42% { stroke-dashoffset: 40; }
          52%, 100% { stroke-dashoffset: 0; }
        }

        @keyframes popBase1 {
          0%, 25% { transform: scaleY(0); opacity: 0; }
          35%, 100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes popBase2 {
          0%, 30% { transform: scaleY(0); opacity: 0; }
          40%, 100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes popN1 {
          0%, 45% { transform: scale(0); opacity: 0; }
          55%, 100% { transform: scale(1); opacity: 1; }
        }

        @keyframes popN2 {
          0%, 48% { transform: scale(0); opacity: 0; }
          58%, 100% { transform: scale(1); opacity: 1; }
        }

        @keyframes popN3 {
          0%, 50% { transform: scale(0); opacity: 0; }
          60%, 100% { transform: scale(1); opacity: 1; }
        }

        @keyframes popN4 {
          0%, 52% { transform: scale(0); opacity: 0; }
          62%, 100% { transform: scale(1); opacity: 1; }
        }

        @keyframes popN5 {
          0%, 55% { transform: scale(0); opacity: 0; }
          65%, 100% { transform: scale(1); opacity: 1; }
        }

        @keyframes revealText {
          0%, 55% { clip-path: inset(0 100% 0 0); opacity: 0; }
          56% { opacity: 1; }
          75%, 100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }

        @keyframes ehubGlobalFade {
          0%, 80% { opacity: 1; transform: scale(1); }
          90%, 100% { opacity: 0; transform: scale(0.95); }
        }
      `}</style>

      <div className="relative px-6 text-center">
        <div className="ehub-loader">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon
              className="path-hex"
              points="100,10 180,55 180,145 100,190 20,145 20,55"
              fill="none"
              stroke="#103154"
              strokeWidth="10"
              strokeLinejoin="round"
            />

            <line
              className="path-base-line"
              x1="45"
              y1="135"
              x2="155"
              y2="135"
              stroke="#103154"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <rect className="pop-rect-1" x="65" y="143" width="70" height="12" fill="#da8530" />
            <rect className="pop-rect-2" x="85" y="159" width="30" height="10" fill="#103154" />

            <path
              className="path-trunk"
              d="M 100,135 L 100,60"
              fill="none"
              stroke="#103154"
              strokeWidth="8"
              strokeLinejoin="miter"
            />
            <path
              className="path-branch-1"
              d="M 100,80 L 70,80"
              fill="none"
              stroke="#103154"
              strokeWidth="8"
              strokeLinejoin="miter"
            />
            <path
              className="path-branch-2"
              d="M 100,95 L 115,95 L 130,80"
              fill="none"
              stroke="#103154"
              strokeWidth="8"
              strokeLinejoin="miter"
            />
            <path
              className="path-branch-3"
              d="M 100,100 L 85,100 L 70,115"
              fill="none"
              stroke="#103154"
              strokeWidth="8"
              strokeLinejoin="miter"
            />
            <path
              className="path-branch-4"
              d="M 100,115 L 130,115"
              fill="none"
              stroke="#103154"
              strokeWidth="8"
              strokeLinejoin="miter"
            />

            <circle className="node node-top" cx="100" cy="50" r="8" fill="#ffffff" stroke="#da8530" strokeWidth="6" />
            <circle className="node node-left-up" cx="58" cy="80" r="8" fill="#ffffff" stroke="#da8530" strokeWidth="6" />
            <circle className="node node-right-up" cx="140" cy="70" r="8" fill="#ffffff" stroke="#da8530" strokeWidth="6" />
            <circle className="node node-left-low" cx="60" cy="125" r="8" fill="#ffffff" stroke="#da8530" strokeWidth="6" />
            <circle className="node node-right-low" cx="142" cy="115" r="8" fill="#ffffff" stroke="#da8530" strokeWidth="6" />
          </svg>

          <div className="ehub-text">
            electronik <span>hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
