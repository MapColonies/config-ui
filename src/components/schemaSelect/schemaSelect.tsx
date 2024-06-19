import React, { useMemo } from 'react';
import { getSchemasTree } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { GroupOption, flattenData } from './schemaSelect.utils';
import { Autocomplete, Box, FilterOptionsState, ListSubheader, TextField } from '@mui/material';

type SchemaSelectProps = {
  onChange: (value: string) => void;
  initialValue?: string;
  error: string | undefined;
};

export const SchemaSelect: React.FC<SchemaSelectProps> = ({ onChange, initialValue, error }) => {
  const { data, isSuccess } = useQuery({ queryKey: ['getSchemasTree'], queryFn: () => getSchemasTree() });

  const options = useMemo(() => (isSuccess ? flattenData(data).sort((a, b) => -b.group.localeCompare(a.group)) : []), [data, isSuccess]);

  const initialSelection = useMemo(() => options.find((option) => option.id === initialValue) ?? null, [options, initialValue]);

  const handleSelectChange = (_, value: GroupOption | null) => {
    if (value) {
      onChange(value.id);
    }
  };

  const filterOptions = (options: GroupOption[], state: FilterOptionsState<GroupOption>): GroupOption[] => {
    const inputValue = state.inputValue.toLowerCase();
    return options.filter((option) => option.title.toLowerCase().includes(inputValue) || option.group.toLowerCase().includes(inputValue));
  };

  return (
    <Autocomplete
      id="select-schema"
      value={initialSelection}
      options={options}
      groupBy={(option) => option.group}
      getOptionLabel={(option) => option.id}
      renderInput={(params) => <TextField {...params} label="Select Schema" error={!!(error ?? '')} helperText={error} />}
      renderGroup={(params) => (
        <Box key={params.key}>
          <ListSubheader>{params.group}</ListSubheader>
          {params.children}
        </Box>
      )}
      filterOptions={filterOptions}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onChange={handleSelectChange}
    />
  );
};
