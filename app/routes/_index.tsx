import { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import Board from "~/components/board/Board";
import PlayAgainButton from "~/components/button/PlayAgainButton";
import Header from "~/components/header/Header";
import GuessInput from "~/components/input/GuessInput";
import MessageDisplay from "~/components/message/DisplayMessage";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const guess = formData.get("guess") as string;
  const res = await fetch(process.env.API_URL + `?guess=${guess}&size=5`);
  const data = await res.json();

  return Response.json(data);
}

type ApiData = {
  slot: number;
  guess: string;
  result: string;
};

const initAttempts = Array(6)
  .fill(null)
  .map(() => Array(5).fill(""));

const initColorData = Array(6)
  .fill(null)
  .map(() => Array(5).fill("bg-gray-600"));

export default function Index() {
  const fetcher = useFetcher();
  const [attempts, setAttempts] = useState<string[][]>(initAttempts);
  const [colors, setColors] = useState<string[][]>(initColorData);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [input, setInput] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const determineGameStatus = (evaluation: ApiData[], currentAttempt: number) => {
    if (evaluation.every((item) => item.result === "correct")) {
      return {
        message: "Congratulations! You've guessed the word!",
        gameOver: true,
        nextAttempt: currentAttempt,
      };
    } else if (currentAttempt === 5) {
      return {
        message: "Game Over! Better luck next time!",
        gameOver: true,
        nextAttempt: currentAttempt,
      };
    } else {
      return {
        message: "",
        gameOver: false,
        nextAttempt: currentAttempt + 1,
      };
    }
  }
  const resetGame = () => {
    setAttempts(initAttempts);
    setColors(initColorData);
    setGameOver(false);
    setMessage("");
  };

  const initColors = (evaluation: ApiData[]) => {
    const newColors = [...colors];
    newColors[currentAttempt] = evaluation.map((item: any) => {
      if (item.result === "correct") return "bg-green-500";
      if (item.result === "present") return "bg-yellow-500 animate-shift";
      return "bg-gray-700";
    });
    setColors(newColors);
  };

  const initAttempt = (evaluation: ApiData[]) => {
    // Map API results to the letters (guesses)
    const newAttempts = [...attempts];
    newAttempts[currentAttempt] = evaluation.map((item: any) =>
      item.guess.toUpperCase()
    );
    setAttempts(newAttempts);
  };

  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as ApiData[];
      const evaluation = [...data].sort((a: any, b: any) => a.slot - b.slot);
      initColors(evaluation);
      initAttempt(evaluation);
      const {
        message: newMessage,
        gameOver: newGameOver,
        nextAttempt,
      } = determineGameStatus(evaluation, currentAttempt);
      setMessage(newMessage);
      setGameOver(newGameOver);
      setCurrentAttempt(nextAttempt);
      setInput("");
    }
  }, [fetcher.data]);

  const handleGuess = () => {
    if (input.length !== 5) {
      setMessage("Please enter a 5-letter word!");
      return;
    }
    fetcher.submit({ guess: input.toUpperCase() }, { method: "post" });
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <Header />
      <Board attempts={attempts} colors={colors} />
      <GuessInput
        input={input}
        setInput={setInput}
        handleGuess={handleGuess}
        gameOver={gameOver}
      />
      <MessageDisplay message={message} />
      {gameOver && <PlayAgainButton onReset={resetGame} />}
    </div>
  );
}
