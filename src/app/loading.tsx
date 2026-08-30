import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="grid h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-green" />
        <p className="mono text-[0.7rem] uppercase tracking-widest text-ink-soft">Loading...</p>
      </div>
    </div>
  );
}
