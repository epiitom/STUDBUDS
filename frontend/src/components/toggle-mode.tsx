"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ToggleMode: React.FC = () => {
	const [theme, setTheme] = useState<string | null>(null);

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme") || "light";
		setTheme(savedTheme);
		document.documentElement.classList.toggle("dark", savedTheme === "dark");
	}, []);

	const toggleTheme = () => {
		if (!theme) return;
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");
	};

	if (theme === null) return null;

	return (
		<button onClick={toggleTheme} className="p-2 rounded-md border border-gray-300 dark:border-gray-600">
			{theme === "dark" ? <Moon /> : <Sun />}
		</button>
	);
};

export default ToggleMode;
