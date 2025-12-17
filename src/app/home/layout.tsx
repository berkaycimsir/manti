'use client';

import { useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '~/components/sidebar';
import { api } from '~/trpc/react';

interface LayoutContextValue {
  isLayoutVisible: boolean;
  toggleLayout: () => void;
  showLayout: () => void;
  hideLayout: () => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  isLayoutVisible: true,
  toggleLayout: () => {},
  showLayout: () => {},
  hideLayout: () => {},
});

export const useLayoutContext = () => useContext(LayoutContext);

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLayoutVisible, setIsLayoutVisible] = useState(true);

  // Fetch connections for sidebar
  const { data: connections = [] } = api.database.listConnections.useQuery();

  // Extract connection ID from pathname if on a db/table page
  const getSelectedConnectionId = () => {
    const match = pathname.match(/\/home\/([^/]+)/);
    if (match) {
      const dbname = match[1];
      const connectionId = Number.parseInt(dbname?.split('-').pop() || '0', 10);
      return connectionId > 0 ? connectionId : null;
    }
    return null;
  };

  const selectedConnection = getSelectedConnectionId();

  const handleSelectConnection = (id: number | null) => {
    if (id && id > 0) {
      const conn = connections.find((c) => c.id === id);
      if (conn) {
        router.push(
          `/home/${conn.name.toLowerCase().replace(/\s+/g, '-')}-${id}`
        );
      }
    }
  };

  const handleAddConnection = () => {
    router.push('/home');
  };

  const toggleLayout = () => setIsLayoutVisible((prev) => !prev);
  const showLayout = () => setIsLayoutVisible(true);
  const hideLayout = () => setIsLayoutVisible(false);

  return (
    <LayoutContext.Provider
      value={{ isLayoutVisible, toggleLayout, showLayout, hideLayout }}
    >
      <div className="flex h-screen bg-background">
        {isLayoutVisible && (
          <Sidebar
            connections={connections}
            selectedConnection={selectedConnection}
            onSelectConnection={handleSelectConnection}
            onAddConnection={handleAddConnection}
          />
        )}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </LayoutContext.Provider>
  );
}
