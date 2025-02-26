type PlayAgainButtonProps = {
  onReset: () => void;
};

export default function PlayAgainButton({ onReset }: PlayAgainButtonProps) {
  return (
    <button
      onClick={onReset}
      className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700"
    >
      Play Again
    </button>
  );
}
