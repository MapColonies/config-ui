import { Autocomplete, Box, ListSubheader, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getSchemasTree, schemaTreeDir } from '../../api/client';
import { useState } from 'react';
import { GroupOption, flattenData } from './schemaSelect.types';
import { SchemaSelectValue } from '../../pages/createConfig/step1GeneralInfo/step1GeneralInfo.schemas';

type SchemaSelectProps = {
  onChange: (value: SchemaSelectValue) => void;
  initialValue?: SchemaSelectValue;
};

export const SchemaSelect: React.FC<SchemaSelectProps> = ({ onChange, initialValue }) => {
  const { data, isSuccess } = useQuery({ queryKey: ['getSchemasTree'], queryFn: () => getSchemasTree() });

  const [topLevelSelection, setTopLevelSelection] = useState<schemaTreeDir | null>(initialValue?.topLevel ?? null);
  const [midLevelSelection, setMidLevelSelection] = useState<schemaTreeDir | null>(initialValue?.midLevel ?? null);
  const [schemaSelection, setSchemaSelection] = useState<GroupOption | null>(initialValue?.schemaSelection ?? null);

  // Handle changes for the top level selection
  const handleTopLevelChange = (_, value: schemaTreeDir | null) => {
    setTopLevelSelection(value);
    setMidLevelSelection(null);
    setSchemaSelection(null);
    onChange({ topLevel: value, midLevel: null, schemaSelection: null });
  };

  // Handle changes for the mid level selection
  const handleMidLevelChange = (_, value: schemaTreeDir | null) => {
    setMidLevelSelection(value);
    setSchemaSelection(null);
    onChange({ topLevel: topLevelSelection, midLevel: value, schemaSelection: null });
  };

  const handleLowLevelChange = (_, value: GroupOption | null) => {
    setSchemaSelection(value);
    onChange({ topLevel: topLevelSelection, midLevel: midLevelSelection, schemaSelection: value });
  };

  const topLevelOptions = isSuccess ? data : [];
  const midLevelOptions = topLevelSelection ? topLevelSelection.children ?? [] : [];
  const lowLevelOptions = midLevelSelection ? midLevelSelection.children ?? [] : [];

  const schemaOptions = flattenData(lowLevelOptions);
  return (
    <Box sx={{ display: 'flex', gap: '10vh' }}>
      <Autocomplete
        options={topLevelOptions}
        getOptionLabel={(option) => option.name ?? ''}
        renderInput={(params) => <TextField {...params} label="Select Top Level" />}
        onChange={handleTopLevelChange}
        value={topLevelSelection}
        sx={{ width: 500 }}
      />
      <Autocomplete
        options={midLevelOptions}
        getOptionLabel={(option) => option.name ?? ''}
        renderInput={(params) => <TextField {...params} label="Select Mid Level" />}
        onChange={handleMidLevelChange}
        value={midLevelSelection}
        sx={{ width: 500 }}
        disabled={!topLevelSelection}
      />

      <Autocomplete
        id="grouped-demo"
        value={schemaSelection}
        options={schemaOptions.sort((a, b) => -b.group.localeCompare(a.group))}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.title}
        sx={{ width: 500 }}
        renderInput={(params) => <TextField {...params} label="Select Schema" />}
        renderGroup={(params) => (
          <Box key={params.key}>
            <ListSubheader>{params.group}</ListSubheader>
            {params.children}
          </Box>
        )}
        disabled={!midLevelSelection}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        onChange={handleLowLevelChange}
      />
    </Box>
  );
};
