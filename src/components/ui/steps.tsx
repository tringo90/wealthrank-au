import { Steps } from "@ark-ui/react/steps";
import { ClipboardList, BarChart2, Lightbulb, Check } from "lucide-react";

const steps = [
  { icon: ClipboardList, label: "Enter your numbers" },
  { icon: BarChart2,     label: "See your percentile" },
  { icon: Lightbulb,    label: "Understand your position" },
];

const descriptions = [
  "Age, assets, and liabilities. Takes under a minute. Nothing is stored.",
  "Instantly compare against Australians your age or all Australians.",
  "Get your milestone, super check, and a what-if growth simulator.",
];

interface HowItWorksProps {
  onStart: () => void;
}

export default function HowItWorks({ onStart }: HowItWorksProps) {
  return (
    <div className="w-full px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2" style={{color:"#E8935A"}}>
            How it works
          </div>
          <h2 className="font-extrabold tracking-tight" style={{fontSize:"clamp(20px,3.5vw,30px)",color:"#F0EDE6"}}>
            Up and running in 60 seconds
          </h2>
        </div>

        <Steps.Root count={3} defaultStep={0}>

          {/* Step indicators */}
          <Steps.List className="flex justify-between items-center mb-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Steps.Item key={index} index={index} className="relative flex not-last:flex-1 items-center">
                  <Steps.Trigger className="flex items-center gap-3 text-left rounded-md group focus:outline-none">
                    <Steps.Indicator
                      className="flex justify-center items-center shrink-0 rounded-full font-semibold w-10 h-10 text-sm border-2 transition-all duration-300
                        data-[state=complete]:border-[#E8935A] data-[state=complete]:bg-[#E8935A] data-[state=complete]:text-[#0D1B2A]
                        data-[state=current]:border-[#E8935A] data-[state=current]:bg-[rgba(232,147,90,0.12)] data-[state=current]:text-[#E8935A]
                        data-[state=incomplete]:border-[rgba(240,237,230,0.1)] data-[state=incomplete]:bg-[rgba(240,237,230,0.04)] data-[state=incomplete]:text-[rgba(240,237,230,0.3)]"
                    >
                      <Icon className="w-4 h-4 group-data-[state=complete]:hidden" />
                      <Check className="w-4 h-4 hidden group-data-[state=complete]:block" />
                    </Steps.Indicator>
                  </Steps.Trigger>
                  <Steps.Separator
                    hidden={index === steps.length - 1}
                    className="flex-1 h-px mx-3 transition-all duration-500
                      data-[state=complete]:bg-[#E8935A]"
                    style={{background:"rgba(240,237,230,0.1)"}}
                  />
                </Steps.Item>
              );
            })}
          </Steps.List>

          {/* Step content */}
          {steps.map((step, index) => (
            <Steps.Content key={index} index={index}>
              <div className="rounded-2xl p-8 text-center" style={{background:"#142133",border:"1px solid rgba(232,147,90,0.15)"}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:"#E8935A"}}>
                  Step {index + 1} of {steps.length}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{color:"#F0EDE6"}}>{step.label}</h3>
                <p className="text-sm leading-relaxed mb-6 max-w-sm mx-auto" style={{color:"rgba(240,237,230,0.62)"}}>
                  {descriptions[index]}
                </p>
                <div className="flex gap-3 justify-center">
                  {index > 0 && (
                    <Steps.PrevTrigger
                      className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                      style={{border:"1px solid rgba(240,237,230,0.12)",background:"transparent",color:"rgba(240,237,230,0.55)",cursor:"pointer"}}
                    >
                      Back
                    </Steps.PrevTrigger>
                  )}
                  {index < steps.length - 1 ? (
                    <Steps.NextTrigger
                      className="px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                      style={{background:"#E8935A",color:"#0D1B2A",border:"none",cursor:"pointer"}}
                    >
                      Next
                    </Steps.NextTrigger>
                  ) : (
                    <button
                      onClick={onStart}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                      style={{background:"#E8935A",color:"#0D1B2A",border:"none",cursor:"pointer"}}
                    >
                      Calculate my rank →
                    </button>
                  )}
                </div>
              </div>
            </Steps.Content>
          ))}

          <Steps.CompletedContent>
            <div className="rounded-2xl p-8 text-center" style={{background:"#142133",border:"1px solid rgba(91,160,138,0.2)"}}>
              <div className="text-sm font-semibold mb-2" style={{color:"#5BA08A"}}>All done!</div>
              <p className="text-sm mb-4" style={{color:"rgba(240,237,230,0.62)"}}>You know how it works. Ready to find your rank?</p>
              <button onClick={onStart} className="px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity" style={{background:"#E8935A",color:"#0D1B2A",border:"none",cursor:"pointer"}}>
                Calculate my rank →
              </button>
            </div>
          </Steps.CompletedContent>

        </Steps.Root>
      </div>
    </div>
  );
}
