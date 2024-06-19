import React from 'react';
import { Table, TableCell, TableContainer, TableRow, IconButton, Collapse, Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link } from 'react-router-dom';
import { KeyboardArrowRight } from '@mui/icons-material';

export type NestedData = {
  name: string;
  children?: NestedData[];
  id?: string;
};

type NestedTableProps = {
  data: NestedData[];
};

const NestedTable: React.FC<NestedTableProps> = ({ data }) => {
  return (
    <TableContainer>
      <Table>
        {data.map((item) => (
          <NestedTableRow key={item.name} row={item} />
        ))}
      </Table>
    </TableContainer>
  );
};

type NestedTableRowProps = {
  row: NestedData;
};

const NestedTableRow: React.FC<NestedTableRowProps> = ({ row }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {
        <>
          <TableRow>
            <TableCell>
              <IconButton size="small" onClick={() => setOpen(!open)}>
                {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRight />}
              </IconButton>
              {row.name}
            </TableCell>
            <TableCell component="th" scope="row" sx={{ alignItems: 'center' }}></TableCell>
            <TableCell align="right">{/* Add any additional cell content here, like actions or icons */}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <Box margin={1}>
                  <Typography fontSize={'16px'} gutterBottom component="div">
                    {row.id ?? '' ? <Link to={`/schema/view?id=${row.id}`}>{row.id}</Link> : ''}
                  </Typography>
                  {/* If the row has children, recursively render them */}
                  {row.children && <NestedTable data={row.children} />}
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        </>
      }
    </>
  );
};

export default NestedTable;