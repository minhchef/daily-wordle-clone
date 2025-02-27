import { useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import Board from "~/components/board/Board";
import PlayAgainButton from "~/components/button/PlayAgainButton";
import Header from "~/components/header/Header";
import MessageDisplay from "~/components/message/DisplayMessage";
import { ActionFunctionArgs } from "@remix-run/node";
import { Ollama } from "ollama";

type ApiData = {
  slot: number;
  guess: string;
  result: "correct" | "present" | "absent";
};

type GameState = {
  board: string[][];
  colors: string[][];
  lastGuess: string;
  attempt: number;
  success: boolean;
};

const MAX_ATTEMPTS = 200;
const WORD_LENGTH = 5;

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  let guess = formData.get("guess") as string;
  const auto = formData.get("auto");

  let board = JSON.parse(formData.get("board") as string || "[]");
  let colors = JSON.parse(formData.get("colors") as string || "[]");
  let attempt = parseInt(formData.get("attempt") as string) || 0;

  if (auto === "true" && attempt < MAX_ATTEMPTS) {
    guess = await getLLMGuess(board, colors);
  }

  const res = await fetch(`${process.env.API_URL}?guess=${guess}&size=${WORD_LENGTH}`);
  const data: ApiData[] = await res.json();

  if (!Array.isArray(data)) {
    return Response.json({ error: "API response invalid" }, { status: 500 });
  }

  board.push(data.map((item) => item.guess.toUpperCase()));
  colors.push(data.map((item) =>
    item.result === "correct" ? "bg-green-500"
    : item.result === "present" ? "bg-yellow-500"
    : "bg-gray-700"
  ));

  attempt++;

  // Check if all letters are "correct"
  const success = data.every((item) => item.result === "correct");

  return Response.json({ 
    board, 
    colors, 
    lastGuess: guess, 
    attempt, 
    success 
  });
}

async function getLLMGuess(board: string[][], colors: string[][]): Promise<string> {
  if (!board.length) return "CRANE"; // Default first guess

  let knownLetters = Array(WORD_LENGTH).fill("_");
  let presentLetters = new Set<string>();
  let absentLetters = new Set<string>();

  for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
    for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex++) {
      const letter = board[rowIndex][colIndex];
      const color = colors[rowIndex][colIndex];

      if (color.includes("green")) {
        knownLetters[colIndex] = letter;
      } else if (color.includes("yellow")) {
        presentLetters.add(letter);
      } else {
        absentLetters.add(letter);
      }
    }
  }

  const knownPattern = knownLetters.join("");
  const prompt = `You are playing Wordle. Based on the following clues, suggest a valid 5-letter word:
  
  - Keep correct letters in place: ${knownPattern}
  - Include these letters (in different positions): ${[...presentLetters].join(", ")}
  - Do NOT include these letters: ${[...absentLetters].join(", ")}

  Respond with only a single 5-letter word, no extra text.`;

  try {
    const ollama = new Ollama({ host: process.env.LLM_URL });
    const response = await ollama.chat({
      model: "llama3.2",
      messages: [{ role: "user", content: prompt }],
    });

    if (response?.message?.content) {
      return response.message.content.trim().slice(0, WORD_LENGTH).toUpperCase();
    }
  } catch (error) {
    console.error("Error calling LLM:", error);
  }
  return "CRANE";
}

export default function Index() {
  const fetcher = useFetcher<GameState>();
  const [attempts, setAttempts] = useState<string[][]>([]);
  const [colors, setColors] = useState<string[][]>([]);
  const [attempt, setAttempt] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [autoGuessing, setAutoGuessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (fetcher.data) {
      const { board, colors, lastGuess, attempt, success } = fetcher.data;

      setAttempts(board);
      setColors(colors);
      setAttempt(attempt);
      setSuccess(success);

      if (success) {
        setMessage(`🎉 Congratulations! You guessed the word: ${lastGuess}`);
        setAutoGuessing(false);
      } else {
        setMessage(`Last guess: ${lastGuess}`);
      }

      if (autoGuessing && attempt < MAX_ATTEMPTS && !success) {
        setTimeout(() => {
          fetcher.submit({ 
            auto: "true", 
            board: JSON.stringify(board), 
            colors: JSON.stringify(colors),
            attempt: attempt.toString()
          }, { method: "post" });
        }, 1000);
      }
    }
  }, [fetcher.data, autoGuessing]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <Header />
      <Board attempts={attempts} colors={colors} />
      
      <div className="flex space-x-4">
        {!success && (
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700" 
            onClick={() => {
              setAutoGuessing(true);
              fetcher.submit({ 
                auto: "true", 
                board: JSON.stringify(attempts), 
                colors: JSON.stringify(colors),
                attempt: attempt.toString()
              }, { method: "post" });
            }}
            disabled={attempt >= MAX_ATTEMPTS || autoGuessing}
          >
            Start Auto Guess
          </button>
        )}
        {autoGuessing && (
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700" 
            onClick={() => setAutoGuessing(false)}
          >
            Stop Auto Guess
          </button>
        )}
      </div>

      <MessageDisplay message={message} />
      {(success || attempt >= MAX_ATTEMPTS) && <PlayAgainButton onReset={() => window.location.reload()} />}
    </div>
  );
}
