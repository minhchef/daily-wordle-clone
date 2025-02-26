type MessageDisplayProps = {
  message: string;
};

export default function MessageDisplay({ message }: MessageDisplayProps) {
  return <p className="text-lg font-semibold">{message}</p>;
}
