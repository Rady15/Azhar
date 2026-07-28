export const CURRENCY_HTML = "<img src='/Saudi_Riyal_Symbol.svg' style='height:1em;width:0.9em;display:inline;vertical-align:middle' />"

export default function CurrencySymbol({ className = "h-[1em] w-[0.9em] inline align-middle" }: { className?: string }) {
  return <img src="/Saudi_Riyal_Symbol.svg" className={className} />
}
