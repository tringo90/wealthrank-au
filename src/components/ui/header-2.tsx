import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';

const TOOL_PAGES = ["calculator", "income", "super", "forecast", "fire"];

interface HeaderProps {
	page: string;
	setPage: (page: string) => void;
}

export function Header({ page, setPage }: HeaderProps) {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);
	const toolActive = TOOL_PAGES.includes(page);

	const links = [
		{ label: 'Home', id: 'home' },
		{ label: 'Tools', id: 'tools' },
		{ label: 'By Generation', id: 'gen' },
		{ label: 'Insights', id: 'insights' },
		{ label: 'About', id: 'about-us' },
	];

	const go = (id: string) => {
		setPage(id);
		setOpen(false);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	React.useEffect(() => {
		document.body.style.overflow = open ? 'hidden' : '';
		return () => { document.body.style.overflow = ''; };
	}, [open]);

	return (
		<header
			className={cn(
				'sticky top-0 z-50 mx-auto w-full border-b border-transparent transition-all ease-out',
				{
					'border-b border-white/5 backdrop-blur-md': scrolled && !open,
					'bg-[#0D1B2A]/90': open,
				},
			)}
			style={{ background: scrolled && !open ? 'rgba(13,27,42,0.92)' : 'rgba(13,27,42,0.96)' }}
		>
			<nav className={cn(
				'flex h-14 w-full items-center justify-between px-5',
			)}>
				{/* Logo */}
				<div
					onClick={() => go('home')}
					className="cursor-pointer font-extrabold text-sm tracking-tight flex items-center gap-1.5"
					style={{ color: '#F0EDE6' }}
				>
					Wealth<span style={{ color: '#E8935A' }}>Rank</span>
					<span className="text-[10px] font-normal" style={{ color: 'rgba(240,237,230,0.3)' }}>AU</span>
					<span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(91,160,138,0.12)', color: '#5BA08A', border: '1px solid rgba(91,160,138,0.2)' }}>v1.5</span>
				</div>

				{/* Desktop nav */}
				<div className="hidden items-center gap-1 md:flex">
					{links.map((link) => {
						const active = link.id === 'tools' ? toolActive : page === link.id;
						return (
							<button
								key={link.id}
								onClick={() => go(link.id)}
								className={cn(
									'px-3 py-1.5 rounded-lg text-xs transition-all duration-150',
									active
										? 'font-bold'
										: 'font-normal hover:bg-white/5',
								)}
								style={{
									color: active ? '#E8935A' : 'rgba(240,237,230,0.55)',
									background: active ? 'rgba(232,147,90,0.1)' : undefined,
								}}
							>
								{link.label}
							</button>
						);
					})}
					<button
						onClick={() => go('calculator')}
						className="ml-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:opacity-90"
						style={{ background: '#E8935A', color: '#0D1B2A' }}
					>
						Calculate my rank
					</button>
				</div>

				{/* Mobile hamburger */}
				<button
					onClick={() => setOpen(!open)}
					className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
					style={{ border: '1px solid rgba(240,237,230,0.12)', color: 'rgba(240,237,230,0.7)' }}
					aria-label="Menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</button>
			</nav>

			{/* Mobile dropdown */}
			<div className={cn(
				'fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col md:hidden',
				open ? 'block' : 'hidden',
			)}
			style={{ background: 'rgba(13,27,42,0.98)' }}
			>
				<div className="flex h-full w-full flex-col justify-between gap-y-2 p-4">
					<div className="grid gap-y-1">
						{links.map((link) => {
							const active = link.id === 'tools' ? toolActive : page === link.id;
							return (
								<button
									key={link.id}
									onClick={() => go(link.id)}
									className="w-full text-left px-4 py-3.5 rounded-xl text-base transition-colors"
									style={{
										color: active ? '#E8935A' : 'rgba(240,237,230,0.65)',
										fontWeight: active ? 700 : 400,
										borderBottom: '1px solid rgba(240,237,230,0.05)',
										background: 'none',
										border: 'none',
									}}
								>
									{link.label}
								</button>
							);
						})}
					</div>
					<button
						onClick={() => go('calculator')}
						className="w-full py-3.5 rounded-xl text-sm font-bold"
						style={{ background: '#E8935A', color: '#0D1B2A' }}
					>
						Calculate my rank
					</button>
				</div>
			</div>
		</header>
	);
}
