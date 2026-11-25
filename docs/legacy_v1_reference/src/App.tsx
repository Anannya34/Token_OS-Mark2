import React from 'react';
import { TokenOSProvider, useTokenOS } from './context/TokenOSContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { UnderstandRequestScreen } from './components/screens/UnderstandRequestScreen';
import { OptimizeRequestScreen } from './components/screens/OptimizeRequestScreen';
import { AIExecutionScreen } from './components/screens/AIExecutionScreen';
import { CheckAnswerScreen } from './components/screens/CheckAnswerScreen';
import { ImproveAnswerScreen } from './components/screens/ImproveAnswerScreen';
import { ExecutionHistoryScreen } from './components/screens/ExecutionHistoryScreen';

const ScreenRouter: React.FC = () => {
  const { activeScreen } = useTokenOS();

  switch (activeScreen) {
    case 'Overview':
      return <OverviewScreen />;
    case 'Understand Request':
      return <UnderstandRequestScreen />;
    case 'Optimize Request':
      return <OptimizeRequestScreen />;
    case 'AI Execution':
      return <AIExecutionScreen />;
    case 'Check Answer':
      return <CheckAnswerScreen />;
    case 'Improve Answer':
      return <ImproveAnswerScreen />;
    case 'Execution History':
      return <ExecutionHistoryScreen />;
    default:
      return <OverviewScreen />;
  }
};

export function App() {
  return (
    <TokenOSProvider>
      <AppShell>
        <ScreenRouter />
      </AppShell>
    </TokenOSProvider>
  );
}

export default App;
