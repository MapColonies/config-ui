import { Link, useNavigate } from 'react-router-dom';
import { GenericTable, TableColumn } from '../../../components/genericTable/genericTable';
import { ClipboardCopyButton } from '../../../components/clipboardCopyButton/clipboardCopyButton';
import { ActionMenu } from '../../../components/actionMenu/actionMenu';
import { MenuItem } from '@mui/material';
import { routes } from '../../../routing/routes';
import { Config } from '../../../api/config/configTypes';

type ConfigTableProps = {
  data: Config[];
};

export const ConfigTable: React.FC<ConfigTableProps> = ({ data }) => {
  const navigate = useNavigate();
  const columns: TableColumn<Config>[] = [
    { id: 'version', label: 'Version', sortable: true },
    {
      id: 'configName',
      label: 'Name',
      sortable: true,
      render: (row: Config) => (
        <>
          <Link to={`/config/${row.configName}`}>{row.configName}</Link>
          <ClipboardCopyButton text={row.configName} />
        </>
      ),
    },
    {
      id: 'schemaId',
      label: 'Schema',
      sortable: true,
      render: (row: Config) => <Link to={`/schema/${row.schemaId}`}>{row.schemaId}</Link>,
    },
    { id: 'createdAt', label: 'Creation Date', sortable: true, format: (value: string) => new Date(value).toLocaleString() },
    { id: 'createdBy', label: 'Owner', sortable: true },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: Config) => (
        <>
          <ActionMenu>
            <MenuItem onClick={() => navigate(`/config/${row.configName}`)}>View Config</MenuItem>
            <MenuItem onClick={() => navigate(routes.CREATE_CONFIG)}>Create new Config</MenuItem>
            <MenuItem>Rollback to version</MenuItem>
          </ActionMenu>
        </>
      ),
    },
  ];

  return <GenericTable<Config> columns={columns} data={data} />;
};
