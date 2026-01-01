'use client';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (connection: any) => void;
  initialData?: any;
}

export default function ConnectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ConnectionModalProps) {
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    connectionString: '',
    sslMode: 'disable' as 'disable' | 'prefer' | 'require' | 'verify-full',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          host: initialData.host || 'localhost',
          port: initialData.port || 5432,
          database: initialData.database || '',
          username: initialData.username || '',
          password: '', // Don't populate password
          connectionString: '', // Don't populate encrypted string
          sslMode: initialData.sslMode || 'disable',
        });
        if (initialData.connectionType) {
          setActiveTab(initialData.connectionType);
        }
      } else {
        // Reset for new connection
        setFormData({
          name: '',
          host: 'localhost',
          port: 5432,
          database: '',
          username: '',
          password: '',
          connectionString: '',
          sslMode: 'disable',
        });
        setActiveTab('manual');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'manual') {
      onSubmit({
        name: formData.name,
        connectionType: 'manual',
        host: formData.host,
        port: formData.port,
        database: formData.database,
        username: formData.username,
        password: formData.password || undefined, // Send undefined if empty (no update)
        ssl: formData.sslMode !== 'disable',
        sslMode: formData.sslMode,
      });
    } else {
      onSubmit({
        name: formData.name,
        connectionType: 'connection_string',
        connectionString: formData.connectionString || undefined,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-xl">
            {isEditing ? 'Edit Connection' : 'New Connection'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="conn-name"
              className="mb-1 block font-medium text-foreground text-sm"
            >
              Connection Name
            </label>
            <Input
              id="conn-name"
              placeholder="My Database"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="connection-string">
                Connection String
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="host"
                    className="mb-1 block font-medium text-foreground text-sm"
                  >
                    Host
                  </label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="port"
                    className="mb-1 block font-medium text-foreground text-sm"
                  >
                    Port
                  </label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="5432"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: Number.parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="database"
                  className="mb-1 block font-medium text-foreground text-sm"
                >
                  Database
                </label>
                <Input
                  id="database"
                  placeholder="postgres"
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block font-medium text-foreground text-sm"
                >
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="postgres"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block font-medium text-foreground text-sm"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isEditing ? '(Unchanged)' : '••••••••'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!isEditing}
                />
              </div>

              <div>
                <label
                  htmlFor="sslMode"
                  className="mb-1 block font-medium text-foreground text-sm"
                >
                  SSL Mode
                </label>
                <select
                  id="sslMode"
                  value={formData.sslMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sslMode: e.target.value as
                        | 'disable'
                        | 'prefer'
                        | 'require'
                        | 'verify-full',
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="disable">Disable - No SSL</option>
                  <option value="prefer">Prefer - Use SSL if available</option>
                  <option value="require">Require - Always use SSL</option>
                  <option value="verify-full">
                    Verify Full - SSL with certificate verification
                  </option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="connection-string" className="space-y-4">
              <div>
                <label
                  htmlFor="conn-string"
                  className="mb-1 block font-medium text-foreground text-sm"
                >
                  Connection String
                </label>
                <Input
                  id="conn-string"
                  type="password"
                  placeholder={
                    isEditing
                      ? '(Unchanged)'
                      : 'postgresql://user:password@localhost:5432/database'
                  }
                  value={formData.connectionString}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      connectionString: e.target.value,
                    })
                  }
                  required={!isEditing}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Enter your PostgreSQL connection string. Example:
                postgresql://user:password@host:5432/database
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? 'Save Changes' : 'Connect'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
