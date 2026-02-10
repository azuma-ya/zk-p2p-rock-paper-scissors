import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { GamePage } from "./pages/GamePage";
import { HowToPlayPage } from "./pages/HowToPlayPage";

function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<GamePage />} />
				<Route path="/how-to-play" element={<HowToPlayPage />} />
			</Route>
		</Routes>
	);
}

export default App;
