import React from 'react';
import { Table, TableCell, TableContainer, TableRow, IconButton, Collapse, Box, Tooltip, Chip, Stack } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link } from 'react-router-dom';
import { KeyboardArrowRight } from '@mui/icons-material';
import Style from './schemaTree.module.scss';

export type NestedData = {
  name: string;
  children?: NestedData[];
  id?: string;
};

type NestedTableProps = {
  data: NestedData[];
};

const NestedTable: React.FC<NestedTableProps> = ({ data }) => {
  const lastChildren = data.filter((item) => !item.children).map((item) => <LastChild key={item.name} data={item} />);
  const nestedRows = data.filter((item) => item.children).map((item) => <NestedTableRow key={item.name} row={item} />);

  return (
    <TableContainer>
      <Table>{nestedRows}</Table>
      <Stack direction={'row'} spacing={1} mt={1} flexWrap={'wrap'} useFlexGap>
        {lastChildren}
      </Stack>
    </TableContainer>
  );
};

type NestedTableRowProps = {
  row: NestedData;
};

const LastChild: React.FC<{ data: NestedData }> = ({ data }) => {
  return (
    <>
      <Tooltip title={data.id} placement="top-start">
        <Chip
          className={Style.chip}
          sx={{ textDecoration: 'none' }}
          clickable
          label={data.name}
          component={Link}
          variant="filled"
          to={`/schema/view?id=${data.id}`}
        />
      </Tooltip>
    </>
  );
};

const NestedTableRow: React.FC<NestedTableRowProps> = ({ row }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          {row.children && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRight />}
            </IconButton>
          )}
          {row.name}
        </TableCell>
        <TableCell component="th" scope="row" sx={{ alignItems: 'center' }}></TableCell>
        <TableCell align="right">{/* Add any additional cell content here, like actions or icons */}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open && row.children != null} timeout="auto" unmountOnExit>
            <Box margin={1}>
              {/* If the row has children, recursively render them */}
              {row.children && <NestedTable data={row.children} />}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default NestedTable;
