type BoardProps = {
  attempts: string[][]; // 2D array of letters
  colors: string[][]; // 2D array of Tailwind color classes for each cell
};

export default function Board({ attempts, colors }: BoardProps) {
  return (
    <div className="grid grid-rows-6 grid-cols-5 gap-2">
      {attempts.map((attempt, rowIndex) =>
        attempt.map((letter, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-12 h-12 flex items-center justify-center text-xl font-bold ${colors[rowIndex][colIndex]} border border-gray-400 text-white`}
          >
            {letter}
          </div>
        ))
      )}
    </div>
  );
}