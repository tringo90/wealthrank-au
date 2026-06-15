import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onCalculate?: () => void;
  onTools?: () => void;
}

function Hero({ onCalculate, onTools }: HeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["your net worth", "your super", "your income", "your wealth rank", "your future"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Free · No sign-up · ABS data <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">Where do you rank</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Compare your net worth, income, and super against real Australian data.
              Free calculators based on ABS 2021–22 figures — no sign-up required.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" onClick={onTools}>
              View all tools <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4" onClick={onCalculate}>
              Calculate my rank <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
