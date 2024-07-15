import { Box, Card, Link as MuiLink, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ApiError, getSchema } from '../../../api/client';
import { MonacoEditor } from '../../../components/monacoEditor/monacoEditor';
import { useCallback, useEffect, useState } from 'react';
import { dereferenceConfig, isConfigRef } from '../../../utils/monaco/configRefHandler';
import { ErrorType } from '../../../components/detailCard/detailCard.types';
import { validateJson } from '../../../utils/ajv';
import { dereferenceJsonSchema } from '../../../utils/schemaRefParser';
import DetailCard, { DetailCardProps } from '../../../components/detailCard/detailCard';
import { Link } from 'react-router-dom';
import { useConfigForm } from '../../../hooks/useConfigForm';

export const Step2AddConfig: React.FC = () => {
  const { state, dispatch } = useConfigForm();
  const { schemaId } = state.formData.step1;
  const { configJsonStringData } = state.formData.step2;
  const fetchSchema = useCallback(() => getSchema({ id: schemaId, shouldDereference: false }), [schemaId]);
  const { data: schema, isSuccess } = useQuery({
    queryKey: [getSchema.name, schemaId],
    queryFn: fetchSchema,
    enabled: !!schemaId,
  });

  const { data: dereferencedSchema } = useQuery({
    queryKey: [dereferenceJsonSchema.name, schemaId],
    enabled: !!schema,
    queryFn: async () => dereferenceJsonSchema(schema),
  });

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errors, setErrors] = useState<DetailCardProps[]>([]);

  //triggering initial validation on component mount
  useEffect(() => {
    handleEditorChange(initialJsonStringData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const handleEditorChange = async (value: string | undefined) => {
    if (value === undefined) {
      return;
    }

    dispatch({ type: 'SET_FORM_DATA', step: 'step2', payload: { configJsonStringData: value } });
    const newErrors: DetailCardProps[] = [];
    let stringValue = value;

    try {
      if (isConfigRef(value)) {
        setIsFetching(true);
        stringValue = await dereferenceConfig(value);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          newErrors.push({ variant: 'error', title: ErrorType.VALIDATION_ERROR, message: 'Config not found' });
        } else {
          newErrors.push({ variant: 'error', title: ErrorType.NETWORK_ERROR, message: error.message });
        }
        dispatch({ type: 'SET_FORM_DATA', step: 'step2', payload: { configData: undefined } });
        dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step2', payload: false });
        setErrors(newErrors);
        return;
      }
    } finally {
      setIsFetching(false);
    }
    try {
      const json = JSON.parse(stringValue);
      const { isValid, errors } = await validateJson(schema, json);
      dispatch({ type: 'SET_FORM_DATA', step: 'step2', payload: { configData: json } });
      dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step2', payload: isValid });
      if (!isValid) {
        errors?.forEach((error) => {
          newErrors.push({ variant: 'error', title: ErrorType.VALIDATION_ERROR, message: error.message });
        });
      }
    } catch (error) {
      let errMessage = 'Error parsing JSON';
      if (error instanceof SyntaxError) {
        errMessage = error.message;
      }
      newErrors.push({ variant: 'error', title: ErrorType.JSON_PARSE_ERROR, message: errMessage });

      dispatch({ type: 'SET_FORM_DATA', step: 'step2', payload: { configData: undefined } });
      dispatch({ type: 'SET_VALIDATION_RESULT', step: 'step2', payload: false });
    }
    setErrors(newErrors);
  };

  return (
    <>
      <Box sx={{ display: 'flex', pt: '1%', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
        <MonacoEditor
          defaultValue={configJsonStringData}
          schema={dereferencedSchema}
          onChange={handleEditorChange}
          height={'70vh'}
          isFetching={isFetching}
        />
        <Card sx={{ width: { xs: '100%', md: '400px', overflowY: 'auto', height: '70vh' } }}>
          {errors.length > 0 ? (
            errors.map((error, index) => <DetailCard variant={error.variant} key={index} title={error.title} message={error.message} />)
          ) : (
            <DetailCard
              variant="success"
              title="Config Is Valid"
              message="Move on to the next step.
            "
            />
          )}
          <DetailCard
            variant="info"
            message={
              <>
                <Typography variant="body2" color="text.secondary">
                  <b>Config Reference:</b> Use the following format to reference an existing config: <b>$ref</b>
                </Typography>
              </>
            }
          />
          <DetailCard
            variant="info"
            message={
              <>
                <Typography variant="body2" color="text.secondary">
                  This config is based on the schema you selected:
                  <Tooltip title={schemaId} placement="top">
                    <MuiLink underline="none" component={Link} to={`/schema/view?schemaId=${schemaId}`} target="_blank">
                      <Typography noWrap>{schemaId}</Typography>
                    </MuiLink>
                  </Tooltip>
                </Typography>
              </>
            }
          />
        </Card>
      </Box>
    </>
  );
};
