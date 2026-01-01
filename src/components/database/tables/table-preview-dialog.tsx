'use client';

import { TableStructure } from '~/components/database/tables/table-structure';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

interface TablePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  table: { name: string; schema: string } | null;
  dbname: string;
}

export function TablePreviewDialog({
  isOpen,
  onClose,
  table,
  dbname,
}: TablePreviewDialogProps) {
  if (!table) return null;

  // Decode connection ID from dbname
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{table.name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-normal text-muted-foreground text-xs">
              {table.schema}
            </span>
          </DialogTitle>
          <DialogDescription>
            Table structure and column definitions
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <TableStructure
            connectionId={connectionId}
            tableName={table.name}
            schema={table.schema}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
