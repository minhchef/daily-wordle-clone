type BoardProps = {
  attempts: string[][]; // 2D array of letters
  colors: string[][]; // 2D array of Tailwind color classes for each cell
};

export default function Board({ attempts, colors }: BoardProps) {
  const displayAttempts = attempts.slice(-6);
  const displayColors = colors.slice(-6);

  return (
    <div className="grid grid-rows-6 grid-cols-5 gap-2">
      {displayAttempts.map((attempt, rowIndex) =>
        attempt.slice(0, 5).map((letter, colIndex) => ( // Ensure only 5 columns
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-12 h-12 flex items-center justify-center text-xl font-bold ${displayColors[rowIndex][colIndex]} border border-gray-400 text-white`}
          >
            {letter}
          </div>
        ))
      )}
    </div>
  );
}
