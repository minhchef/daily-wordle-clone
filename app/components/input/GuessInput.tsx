type GuessInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleGuess: () => void;
  gameOver: boolean;
};

export default function GuessInput({
  input,
  setInput,
  handleGuess,
  gameOver,
}: GuessInputProps) {
  if (gameOver) return null;
  return (
    <div className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={5}
        className="px-4 py-2 text-lg border-2 border-gray-300 bg-gray-700 text-white rounded-md"
      />
      <button
        onClick={handleGuess}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
      >
        Guess
      </button>
    </div>
  );
}
