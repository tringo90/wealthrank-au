import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "tools", label: "Tools" },
  { id: "gen", label: "By Generation" },
  { id: "insights", label: "Insights" },
  { id: "about", label: "About the Data" },
];

const TOOL_PAGES = ["calculator", "income", "super", "forecast", "fire"];

interface NavHeaderProps {
  page: string;
  setPage: (page: string) => void;
}

function NavHeader({ page, setPage }: NavHeaderProps) {
  const [position, setPosition] = useState({ left: 0, width: 0, opacity: 0 });
  const toolActive = TOOL_PAGES.includes(page);

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full p-1"
      style={{ border: "1px solid rgba(240,237,230,0.12)", background: "rgba(240,237,230,0.04)" }}
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.id === "tools" ? toolActive : page === item.id;
        return (
          <Tab
            key={item.id}
            setPosition={setPosition}
            onClick={() => setPage(item.id)}
            active={active}
          >
            {item.label}
          </Tab>
        );
      })}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  onClick,
  active,
}: {
  children: React.ReactNode;
  setPosition: React.Dispatch<React.SetStateAction<{ left: number; width: number; opacity: number }>>;
  onClick: () => void;
  active: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
      className="relative z-10 block cursor-pointer px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-xs rounded-full transition-colors"
      style={{
        color: active ? "#E8935A" : "rgba(240,237,230,0.55)",
        fontWeight: active ? 700 : 400,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: { left: number; width: number; opacity: number } }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-full top-0 rounded-full"
      style={{ background: "rgba(232,147,90,0.12)", border: "1px solid rgba(232,147,90,0.2)" }}
    />
  );
};

export default NavHeader;
