import { useState } from 'react';
import Styles from './genericTable.module.scss';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';

type PrimitiveObject = Record<string, string | number | boolean>;

export type TableColumn<T extends PrimitiveObject, K extends keyof T = keyof T> = {
  id: K | 'actions';
  label: string;
  sortable?: boolean;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: T[K]) => string;
  render?: (raw: T) => React.ReactNode;
};

export type GenericTableProps<T extends PrimitiveObject> = {
  data: T[];
  columns: TableColumn<T>[];
};

export const GenericTable = <T extends PrimitiveObject>({ data, columns }: GenericTableProps<T>) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | ''>('');

  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = data.sort((a, b) => {
    if (orderBy === '') return 0;
    if (order === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    }
    return a[orderBy] > b[orderBy] ? -1 : 1;
  });

  return (
    <Paper>
      <TableContainer sx={{ maxHeight: '80vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id as string} align={column.align}>
                  <TableSortLabel
                    className={Styles.tableColumn}
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    disabled={!(column.sortable ?? false)}
                    onClick={() => column.id !== 'actions' && handleRequestSort(column.id as keyof T)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row: T, index: number) => (
              <TableRow key={index}>
                {columns.map((column: TableColumn<T>) => {
                  const cellValue = row[column.id as keyof T];
                  const cellFormat = column.format ? column.format(cellValue) : cellValue;
                  const cellRender = column.render ? column.render(row) : cellFormat;
                  return (
                    <TableCell key={column.id as string} align={column.align}>
                      {cellRender}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
