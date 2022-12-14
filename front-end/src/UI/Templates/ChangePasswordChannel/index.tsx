import React from 'react';
import { LockIcon } from '@chakra-ui/icons';
import { Grid, GridItem, VStack, Input, Button, Text } from '@chakra-ui/react';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import useWarningDialog from '../../../Hooks/useWarningDialog';
import ChannelType from '../../../Props/ChannelType';

type ChangePasswordProps = {
  password: string;
};

const ChangePasswordChannelScheme = Yup.object().shape({
  password: Yup.string()
    .min(3, '입장 비밀번호는 3자 이상이어야 합니다.')
    .max(10, '입장 비밀번호는 10자를 초과할 수 없습니다.'),
});

function ChangePasswordChannel() {
  const { setError, WarningDialogComponent } = useWarningDialog();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const onSubmitHandler = React.useCallback(
    (
      { password }: ChangePasswordProps,
      actions: FormikHelpers<ChangePasswordProps>,
    ) => {
      axios
        .patch(`chat/${id}`, {
          password,
          type: password.length ? ChannelType.PROTECT : ChannelType.PUBLIC,
        })
        .then(() => {
          actions.resetForm();
          queryClient.invalidateQueries(['channels']);
          actions.setSubmitting(false);
        })
        .catch((err) => {
          if (err.response) {
            setError({
              headerMessage: '비밀번호 변경 실패',
              bodyMessage: err.response.data.message,
            });
          } else {
            setError({
              headerMessage: '비밀번호 변경 실패',
              bodyMessage: err.message,
            });
          }
          actions.setSubmitting(false);
        });
    },
    [setError, id, queryClient],
  );

  return (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={onSubmitHandler}
      validationSchema={ChangePasswordChannelScheme}
    >
      {({ isSubmitting }) => (
        <>
          <Form>
            <Grid
              h="full"
              w="full"
              templateRows="reapeat(4, 1fr)"
              templateColumns="repeat(6, 1fr)"
            >
              <GridItem rowSpan={1} colSpan={1}>
                <LockIcon fontSize={40} />
              </GridItem>
              <GridItem rowSpan={2} colSpan={5}>
                <VStack align="baseline">
                  <Field
                    as={Input}
                    variant="flushed"
                    name="password"
                    type="password"
                    placeholder="변경할 입장 패스워드"
                    my="0"
                  />
                  <Text
                    fontSize="xs"
                    textColor="red.500"
                    mt="0!important"
                    pb="12px"
                  >
                    <ErrorMessage name="password" />
                  </Text>
                </VStack>
              </GridItem>
              <GridItem rowSpan={2} colSpan={4} />
              <GridItem rowSpan={1} colSpan={2}>
                <Button
                  type="submit"
                  colorScheme="gray"
                  width="100%"
                  isLoading={isSubmitting}
                >
                  변경하기
                </Button>
              </GridItem>
            </Grid>
          </Form>
          {WarningDialogComponent}
        </>
      )}
    </Formik>
  );
}

export default ChangePasswordChannel;
