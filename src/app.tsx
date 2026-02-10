import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout";
import { GamePage } from "./pages/game-page";
import { HowToPlayPage } from "./pages/how-to-play-page";

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
