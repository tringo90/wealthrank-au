"use client";

import { cn } from "@/lib/utils";
import { Layers, Search, Zap } from "lucide-react";
import type React from "react";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({ icon, title, description, benefits }) => (
  <div
    className={cn(
      "relative flex h-full flex-col rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted"
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary mx-auto">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-center">{title}</h3>
    <p className="mb-6 text-muted-foreground text-center">{description}</p>
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          <span className="text-muted-foreground">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({ className, ...props }) => {
  const stepsData = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Enter your numbers",
      description: "Age, assets, and liabilities. Takes under a minute. Nothing is stored or shared.",
      benefits: [
        "Individual or couple mode",
        "Quick or deep-dive entry",
        "Zero data stored on our servers",
      ],
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "See your percentile",
      description: "Instantly compare your net worth against real Australian wealth data from the ABS.",
      benefits: [
        "Age-adjusted percentile ranking",
        "Compare all Australians or your age group",
        "Wealth label from Starting Out to Wealth Leader",
      ],
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Know where you stand",
      description: "Get your next milestone, super check, and a what-if growth simulator.",
      benefits: [
        "Next wealth milestone to aim for",
        "Super balance on-track check",
        "30-year growth projection simulator",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("w-full bg-background py-16 sm:py-24", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Up and running in 60 seconds. Free, private, and built on authoritative ABS data.
          </p>
        </div>

        <div className="relative mx-auto mb-8 w-full max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-border"
          />
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-muted font-semibold text-foreground ring-4 ring-background"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
