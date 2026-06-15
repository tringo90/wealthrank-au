import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="rgba(232,147,90,1)"
                        strokeWidth={path.width}
                        strokeOpacity={0.08 + path.id * 0.015}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Where do you rank financially?",
    onCalculate,
    onTools,
}: {
    title?: string;
    onCalculate?: () => void;
    onTools?: () => void;
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-[86vh] w-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
                        style={{background:"rgba(232,147,90,0.1)",border:"1px solid rgba(232,147,90,0.22)",color:"#E8935A"}}>
                        ABS data · Free · No sign-up
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay: wordIndex * 0.1 + letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block"
                                        style={{ color: wordIndex === words.length - 1 ? "#E8935A" : "#F0EDE6" }}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="text-base md:text-lg mb-4 max-w-md mx-auto"
                        style={{ color: "rgba(240,237,230,0.62)", lineHeight: 1.75 }}
                    >
                        Compare your net worth against real Australian wealth data, by age, household type, and percentile.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="inline-flex items-baseline gap-2 mb-8 px-4 py-2 rounded-lg"
                        style={{ background: "rgba(13,27,42,0.65)", border: "1px solid rgba(240,237,230,0.09)" }}
                    >
                        <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(240,237,230,0.3)" }}>Median Australian net worth</span>
                        <span className="text-lg font-bold" style={{ color: "#E8935A" }}>$350K</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="flex flex-row gap-3 justify-center"
                    >
                        <button
                            onClick={onCalculate}
                            className="px-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90"
                            style={{ background: "#E8935A", color: "#0D1B2A" }}
                        >
                            Calculate my rank
                        </button>
                        <button
                            onClick={onTools}
                            className="px-5 py-3 rounded-xl text-sm transition-all duration-200 hover:border-opacity-30"
                            style={{ background: "transparent", color: "rgba(240,237,230,0.55)", border: "1px solid rgba(240,237,230,0.14)" }}
                        >
                            View generational data
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
