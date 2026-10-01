export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 h-full min-h-[300px]">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
