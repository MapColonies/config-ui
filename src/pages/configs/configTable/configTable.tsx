import { Link, useNavigate } from 'react-router-dom';
import { GenericTable, TableColumn } from '../../../components/genericTable/genericTable';
import { ClipboardCopyButton } from '../../../components/clipboardCopyButton/clipboardCopyButton';
import { ActionMenu } from '../../../components/actionMenu/actionMenu';
import { Box, Link as MuiLink, MenuItem, Tooltip, Typography } from '@mui/material';
import { routes } from '../../../routing/routes';
import Styles from './configTable.module.scss';
import { config } from '../../../api/client';
import { removeBaseUrlFromSchemaId } from '../../../utils/schemaUtils';
import { ConfigModeState } from '../../createConfig/createConfig.types';

type TableConfigData = Omit<config, 'config'>;

type ConfigTableProps = {
  data: TableConfigData[];
};

export const ConfigTable: React.FC<ConfigTableProps> = ({ data }) => {
  const navigate = useNavigate();
  const columns: TableColumn<TableConfigData>[] = [
    {
      id: 'configName',
      label: 'Name',
      sortable: true,
      render: (row: TableConfigData) => {
        const configNameWithVersion = `${row.configName}:v${row.version}`;
        return (
          <>
            <Box className={Styles.columnWithCopyButton}>
              <ClipboardCopyButton text={row.configName} />

              <MuiLink underline="none" component={Link} to={`/config/${row.configName}/${row.version}/${encodeURIComponent(row.schemaId)}`}>
                <Tooltip title={configNameWithVersion} placement="top-start">
                  <Typography className={Styles.truncate} noWrap>
                    {configNameWithVersion}
                  </Typography>
                </Tooltip>
              </MuiLink>
            </Box>
          </>
        );
      },
    },
    {
      id: 'schemaId',
      label: 'Schema',
      sortable: true,
      render: (row: TableConfigData) => (
        <Box className={Styles.columnWithCopyButton}>
          <ClipboardCopyButton text={row.schemaId} />
          <MuiLink underline="none" component={Link} to={`/schema/view?schemaId=${row.schemaId}`}>
            <Tooltip title={row.schemaId} placement="top-start">
              <Typography>{removeBaseUrlFromSchemaId(row.schemaId)}</Typography>
            </Tooltip>
          </MuiLink>
        </Box>
      ),
    },
    { id: 'createdAt', label: 'Creation Date', sortable: true, format: (value) => new Date((value as string) ?? '').toLocaleString() },
    { id: 'createdBy', label: 'Owner', sortable: true },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: TableConfigData) => (
        <>
          <ActionMenu>
            <MenuItem onClick={() => navigate(`/config/${row.configName}/${row.version}/${encodeURIComponent(row.schemaId)}`)}>View Config</MenuItem>
            <MenuItem
              onClick={() =>
                navigate(routes.CREATE_CONFIG, {
                  state: {
                    versionedConfigData: { name: row.configName, version: 'latest', schemaId: row.schemaId },
                    mode: 'NEW_VERSION',
                  } as ConfigModeState,
                })
              }
            >
              Create New Version
            </MenuItem>
            <MenuItem
              onClick={() =>
                navigate(routes.CREATE_CONFIG, {
                  state: {
                    versionedConfigData: { name: row.configName, version: row.version, schemaId: row.schemaId },
                    mode: 'ROLLBACK',
                  } as ConfigModeState,
                })
              }
            >
              Rollback To Version
            </MenuItem>
          </ActionMenu>
        </>
      ),
    },
  ];

  return <GenericTable<TableConfigData> columns={columns} data={data} />;
};
