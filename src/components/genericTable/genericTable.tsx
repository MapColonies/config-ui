/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import Styles from './genericTable.module.scss';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';

export type TableColumn<T> = {
  id: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
  render?: (raw: T) => React.ReactNode;
};

export type GenericTableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
};

export const GenericTable = <T,>({ data, columns }: GenericTableProps<T>) => {
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
      <Box></Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id as string}>
                  <TableSortLabel
                    className={Styles.tableColumn}
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    disabled={!column.sortable}
                    onClick={() => column.id !== 'actions' && handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row: any, index: number) => (
              <TableRow key={index}>
                {columns.map((column: TableColumn<T>) => {
                  const cellValue = row[column.id as keyof T];
                  const cellFormat = column.format ? column.format(cellValue) : cellValue;
                  const cellRender = column.render ? column.render(row) : cellFormat;
                  return <TableCell key={column.id as string}>{cellRender}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
