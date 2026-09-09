import { Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { HomeScreen } from './screens/HomeScreen';
import { PlayScreen } from './screens/PlayScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { SeasonScreen } from './screens/SeasonScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:pt-16">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/play" element={<PlayScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/season" element={<SeasonScreen />} />
          <Route path="/rewards" element={<RewardsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </main>
    </div>
  );
}
